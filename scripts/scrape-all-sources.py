#!/usr/bin/env python3
"""
Сбор данных о застройщиках / компаниях с:
  - elitka.kg (публичный JSON API /api/objects)
  - house.kg (каталог /business/companies + карточки компаний)
  - 2gis.kg (Catalog API v3, нужен TWO_GIS_API_KEY)

Выход: scraped/merged-companies.json (по умолчанию в корне проекта)

  pip install -r scripts/requirements-scrape.txt
  python3 scripts/scrape-all-sources.py
  python3 scripts/scrape-all-sources.py --skip-house   # только Элитка + 2GIS
  python3 scripts/scrape-all-sources.py --house-delay 0.4
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request
from collections import defaultdict
from datetime import datetime, timezone

try:
    import requests
    from bs4 import BeautifulSoup
except ImportError:
    print("Установите зависимости: pip install -r scripts/requirements-scrape.txt", file=sys.stderr)
    raise

ELITKA_API = "https://elitka.kg/api/objects"
HOUSE_LIST = "https://www.house.kg/business/companies"
HOUSE_ORIGIN = "https://www.house.kg"
TWO_GIS_API = "https://catalog.api.2gis.com/3.0/items"

DEFAULT_2GIS_QUERIES = [
    "строительная компания Бишкек",
    "застройщик Бишкек",
    "ремонт квартир Бишкек",
    "генподряд Бишкек",
    "проектная организация Бишкек",
    "фундамент Бишкек",
    "кровельные работы Бишкек",
    "строительная компания Ош",
]


def norm_phone(s: str | None) -> str | None:
    if not s:
        return None
    digits = re.sub(r"\D", "", s)
    if not digits:
        return None
    if digits.startswith("996") and len(digits) == 12:
        return f"+{digits}"
    if len(digits) == 9:
        return f"+996{digits}"
    if len(digits) == 10 and digits.startswith("0"):
        return f"+996{digits[1:]}"
    if s.strip().startswith("+"):
        return s.strip()
    return s.strip()


def fetch_elitka(cities: list[int], page_size: int, session: requests.Session) -> tuple[list[dict], dict[int, dict]]:
    """Возвращает сырые объекты и агрегированных застройщиков по builder.id."""
    builders: dict[int, dict] = {}
    raw_objects: list[dict] = []

    for city in cities:
        page = 1
        while True:
            r = session.get(
                ELITKA_API,
                params={"page": page, "pageSize": page_size, "city": city},
                timeout=60,
            )
            r.raise_for_status()
            data = r.json()
            items = data.get("items") or []
            for it in items:
                raw_objects.append({"city_id": city, **it})
                b = it.get("builder") or {}
                bid = b.get("id")
                if bid is None:
                    continue
                if bid not in builders:
                    builders[bid] = {
                        "source": "elitka.kg",
                        "builderId": bid,
                        "name": b.get("title"),
                        "slug": b.get("slug"),
                        "phone": norm_phone(b.get("phone1")) or norm_phone(b.get("whatsapp")),
                        "whatsapp": b.get("whatsapp"),
                        "objects": [],
                    }
                builders[bid]["objects"].append(
                    {
                        "title": it.get("title"),
                        "slug": it.get("slug"),
                        "address": it.get("address"),
                        "price_usd_m2": it.get("price_usd"),
                        "price_kgs_m2": it.get("price_kgs"),
                        "gosstroy_registry": it.get("gosstroy_registry"),
                        "finish": it.get("construction_finish_date"),
                    }
                )
            total_pages = int(data.get("totalPages") or 0)
            if page >= total_pages or not items:
                break
            page += 1
            time.sleep(0.15)

    return raw_objects, builders


def house_list_slugs(session: requests.Session) -> list[str]:
    r = session.get(HOUSE_LIST, timeout=60)
    r.raise_for_status()
    soup = BeautifulSoup(r.text, "html.parser")
    slugs: set[str] = set()
    for a in soup.find_all("a", href=True):
        href = a["href"]
        if not href.startswith("/"):
            continue
        if href.startswith(
            (
                "/build/",
                "/favicon",
                "/login",
                "/help",
                "/reklama",
                "/business",
                "/kg/",
                "/en/",
                "/ru/",
                "/add",
                "/urgentads",
            )
        ):
            continue
        path = href.rstrip("/")
        if path == "" or path == "/":
            continue
        slug = path.lstrip("/")
        if re.match(r"^[a-z0-9][a-z0-9\-]{2,}$", slug) and not slug.isdigit():
            slugs.add(slug)
    return sorted(slugs)


def parse_house_company(html: str, slug: str) -> dict:
    soup = BeautifulSoup(html, "html.parser")
    title_el = soup.find("title")
    title = title_el.get_text(strip=True) if title_el else slug
    title = re.sub(r"\s*-\s*Бизнес аккаунт на House\.kg.*$", "", title, flags=re.I).strip()

    phones: list[str] = []
    for a in soup.select(".phones-div a[href], .business-contact.phones-div a"):
        t = a.get_text(strip=True)
        if t and re.search(r"\d", t):
            p = norm_phone(t) or t
            if p not in phones:
                phones.append(p)

    website = None
    for a in soup.select(".business-contact .bc-value a"):
        ht = a.get("href") or ""
        if "/business/contact/" in ht and "/website" in ht:
            website = a.get_text(strip=True) or None
            break

    email = None
    for a in soup.select(".business-contact .bc-value a[href*='mailto'], a[href^='mailto']"):
        if "mailto:" in (a.get("href") or ""):
            email = a["href"].split("mailto:", 1)[-1].split("?")[0]
            break
    if not email:
        for a in soup.select(".business-contact .bc-value a"):
            if "/email" in (a.get("href") or ""):
                email = a.get_text(strip=True) or None
                break

    desc = None
    intro = soup.select_one(".business-description, .company-description, .business-about")
    if intro:
        desc = intro.get_text(" ", strip=True)[:2000]

    return {
        "source": "house.kg",
        "slug": slug,
        "name": title,
        "url": f"{HOUSE_ORIGIN}/{slug}",
        "phones": phones[:5],
        "phone": phones[0] if phones else None,
        "website": website,
        "email": email,
        "description": desc,
    }


def fetch_house_details(slugs: list[str], delay: float, session: requests.Session) -> list[dict]:
    out: list[dict] = []
    for i, slug in enumerate(slugs):
        try:
            r = session.get(f"{HOUSE_ORIGIN}/{slug}", timeout=(8, 22))
            if r.status_code != 200:
                continue
            out.append(parse_house_company(r.text, slug))
        except requests.RequestException as e:
            print(f"house.kg {slug}: {e}", file=sys.stderr)
        if delay > 0:
            time.sleep(delay)
        if (i + 1) % 25 == 0:
            print(f"  house.kg: {i + 1}/{len(slugs)}", file=sys.stderr)
            sys.stderr.flush()
    return out


def fetch_2gis_multi(
    api_key: str,
    region_id: str,
    queries: list[str],
    pages_per_query: int,
    page_size: int,
) -> list[dict]:
    seen: set[str] = set()
    items: list[dict] = []
    for q in queries:
        for page in range(1, pages_per_query + 1):
            params = urllib.parse.urlencode(
                {
                    "q": q,
                    "region_id": region_id,
                    "page": page,
                    "page_size": page_size,
                    "fields": "items.point,items.rubrics,items.schedule,items.contact_groups,items.reviews",
                    "key": api_key,
                }
            )
            url = f"{TWO_GIS_API}?{params}"
            try:
                req = urllib.request.Request(url, headers={"User-Agent": "stroitelniekompaniikyrgyzstan-catalog/1.1"})
                with urllib.request.urlopen(req, timeout=45) as resp:
                    data = json.loads(resp.read().decode("utf-8"))
            except Exception as e:
                print(f"2GIS query {q!r} page {page}: {e}", file=sys.stderr)
                break
            batch = (data.get("result") or {}).get("items") or []
            if not batch:
                break
            for raw in batch:
                firm_id = str(raw.get("id") or "")
                if firm_id in seen:
                    continue
                seen.add(firm_id)
                point = raw.get("point") or {}
                phones = []
                for group in raw.get("contact_groups") or []:
                    for c in group.get("contacts") or []:
                        if c.get("type") == "phone" and c.get("value"):
                            phones.append(c["value"])
                reviews = raw.get("reviews") or {}
                rating = None
                if isinstance(reviews, dict):
                    rating = reviews.get("general_rating") or reviews.get("rating")
                items.append(
                    {
                        "source": "2gis.kg",
                        "name": raw.get("name") or raw.get("name_ex"),
                        "address": raw.get("address_name") or raw.get("full_name"),
                        "lat": point.get("lat"),
                        "lng": point.get("lon"),
                        "phones": phones[:5],
                        "phone": norm_phone(phones[0]) if phones else None,
                        "twogisUrl": f"https://2gis.kg/bishkek/firm/{firm_id}" if firm_id else None,
                        "rawId": firm_id or None,
                        "rating": rating,
                        "query": q,
                    }
                )
        time.sleep(0.2)
    return items


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="scraped/merged-companies.json")
    ap.add_argument("--house-delay", type=float, default=0.25)
    ap.add_argument("--skip-house", action="store_true")
    ap.add_argument("--skip-elitka", action="store_true")
    ap.add_argument("--elitka-cities", default="1,2", help="city ids: 1=Бишкек, 2=Ош")
    ap.add_argument("--elitka-page-size", type=int, default=100)
    ap.add_argument("--gis-pages", type=int, default=3, help="pages per query for 2GIS")
    ap.add_argument("--gis-page-size", type=int, default=50)
    args = ap.parse_args()

    session = requests.Session()
    session.headers.update(
        {
            "User-Agent": "Mozilla/5.0 (compatible; StroitelnieCatalogBot/1.0; +https://stroitelniekompaniikyrgyzstan.com)",
            "Accept-Language": "ru-RU,ru;q=0.9",
        }
    )

    cities = [int(x.strip()) for x in args.elitka_cities.split(",") if x.strip()]
    elitka_raw: list[dict] = []
    elitka_builders: dict[int, dict] = {}
    house_records: list[dict] = []
    gis_records: list[dict] = []

    if not args.skip_elitka:
        print("Elitka.kg: загрузка объектов…", file=sys.stderr)
        elitka_raw, elitka_builders = fetch_elitka(cities, args.elitka_page_size, session)
        print(f"  объектов: {len(elitka_raw)}, уникальных застройщиков: {len(elitka_builders)}", file=sys.stderr)

    if not args.skip_house:
        print("House.kg: список компаний…", file=sys.stderr)
        slugs = house_list_slugs(session)
        print(f"  слагов: {len(slugs)}", file=sys.stderr)
        print("House.kg: карточки (это займёт 1–3 мин)…", file=sys.stderr)
        house_records = fetch_house_details(slugs, args.house_delay, session)
        print(f"  карточек получено: {len(house_records)}", file=sys.stderr)

    key = os.environ.get("TWO_GIS_API_KEY", "").strip()
    region = os.environ.get("TWO_GIS_REGION_ID", "1")
    if key:
        print("2GIS: загрузка по списку запросов…", file=sys.stderr)
        gis_records = fetch_2gis_multi(key, region, DEFAULT_2GIS_QUERIES, args.gis_pages, args.gis_page_size)
        print(f"  уникальных карточек: {len(gis_records)}", file=sys.stderr)
    else:
        print("2GIS: TWO_GIS_API_KEY не задан — пропуск.", file=sys.stderr)

    out_dir = os.path.dirname(os.path.abspath(args.out))
    if out_dir:
        os.makedirs(out_dir, exist_ok=True)

    payload = {
        "scrapedAt": datetime.now(timezone.utc).isoformat(),
        "sources": {
            "elitka": {
                "objectsCount": len(elitka_raw),
                "buildersCount": len(elitka_builders),
                "builders": list(elitka_builders.values()),
            },
            "house_kg": {"companies": house_records},
            "2gis": {"items": gis_records},
        },
        "stats": {
            "elitka_objects": len(elitka_raw),
            "elitka_builders": len(elitka_builders),
            "house_kg_companies": len(house_records),
            "2gis_items": len(gis_records),
        },
    }

    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print(f"Записано: {args.out}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
