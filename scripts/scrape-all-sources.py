#!/usr/bin/env python3
"""
Сбор данных о застройщиках / компаниях с:
  - elitka.kg (публичный JSON API /api/objects)
  - house.kg (каталог /business/companies + карточки компаний)
  - 2gis.kg (Catalog API v3, нужен TWO_GIS_API_KEY)
  - minstroy.gov.kg — официальный реестр лицензий (HTML-таблицы, все уровни 1–6)

Выход: scraped/merged-companies.json (по умолчанию в корне проекта)

  pip install -r scripts/requirements-scrape.txt
  python3 scripts/scrape-all-sources.py
  python3 scripts/scrape-all-sources.py --skip-house   # только Элитка + 2GIS
  python3 scripts/scrape-all-sources.py --skip-minstroy
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
MINSTROY_ORIGIN = "https://minstroy.gov.kg"
MINSTROY_REESTR_RU = "/ru/license/reestr"

# Подписи вкладок реестра (для человекочитаемого вывода)
MINSTROY_LEVEL_LABELS: dict[int, str] = {
    1: "1 уровень",
    2: "2 уровень",
    3: "3 уровень",
    4: "4 уровень",
    5: "Реестр иностранных государств",
    6: "Чёрный список",
}

# Заголовки колонок (как на сайте) → стабильные ключи JSON
MINSTROY_HEADER_KEYS: dict[str, str] = {
    "#": "row_index",
    "Серия": "series",
    "Номер": "license_number",
    "Дата выдачи": "issue_date",
    "Наименование": "company_name",
    "Ф.И.О.": "director_name",
    "Адрес": "address",
    "ИНН": "inn",
    "Лицензиат": "company_name",
    "Иностранное государство выдавшее лицензию": "foreign_license_country",
    "Дата внесения в реестр": "registry_entry_date",
    "Вид деятельности": "activity_type",
    "Тип реестра": "registry_type",
    "Наименование уполномоченного органа установившего нарушение": "violating_authority",
    "решение комиссии": "commission_decision",
    "срок действия лиценизии": "license_valid_until",
    "reestr.license-reestr.apilation": "appeal_available",
}

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


def minstroy_reestr_path(level: int) -> str:
    if level == 1:
        return MINSTROY_REESTR_RU
    return f"{MINSTROY_REESTR_RU}/{level}"


def parse_minstroy_registry_page(html: str, level: int, page: int) -> list[dict]:
    soup = BeautifulSoup(html, "html.parser")
    table = soup.select_one("table.styled-table")
    if not table:
        return []
    headers: list[str] = []
    for tr in table.find_all("tr"):
        ths = tr.find_all("th", recursive=False)
        if ths:
            headers = [th.get_text(strip=True) for th in ths]
            break
    if not headers:
        return []

    keys: list[str] = []
    used: dict[str, int] = {}
    for h in headers:
        base = MINSTROY_HEADER_KEYS.get(h.strip(), h.strip() or "column")
        n = used.get(base, 0)
        used[base] = n + 1
        keys.append(base if n == 0 else f"{base}_{n}")

    path = minstroy_reestr_path(level)
    list_url = f"{MINSTROY_ORIGIN}{path}"

    out: list[dict] = []
    for tr in table.select("tr.building-row"):
        tds = tr.find_all("td", recursive=False)
        cells = [td.get_text(" ", strip=True) for td in tds]
        if not cells:
            continue
        row: dict[str, object] = {
            "source": "minstroy.gov.kg",
            "registry_level": level,
            "registry_level_label": MINSTROY_LEVEL_LABELS.get(level, str(level)),
            "registry_list_url": list_url,
            "registry_page": page,
        }
        for i, key in enumerate(keys):
            if i < len(cells):
                row[key] = cells[i]
        out.append(row)
    return out


def minstroy_slim_for_inn_index(rec: dict) -> dict:
    """Компактная запись для by_inn (без дублирования всех полей в JSON)."""
    keys = (
        "registry_level",
        "registry_level_label",
        "registry_list_url",
        "registry_page",
        "series",
        "license_number",
        "issue_date",
        "company_name",
        "director_name",
        "address",
        "commission_decision",
        "license_valid_until",
        "registry_entry_date",
        "activity_type",
    )
    return {k: rec[k] for k in keys if k in rec and rec[k]}


def fetch_minstroy_all_levels(
    session: requests.Session,
    levels: list[int],
    page_limit: int,
    delay_s: float,
) -> tuple[list[dict], dict[str, list[dict]]]:
    """Скачивает все страницы реестра для каждого уровня. Возвращает плоский список и индекс по ИНН."""
    flat: list[dict] = []
    by_inn: dict[str, list[dict]] = defaultdict(list)

    for level in levels:
        path = minstroy_reestr_path(level)
        base = f"{MINSTROY_ORIGIN}{path}"
        page = 1
        level_total = 0
        while page <= page_limit:
            try:
                r = session.get(base, params={"page": page, "limit": 100}, timeout=60)
                if r.status_code != 200:
                    print(f"  minstroy уровень {level} стр. {page}: HTTP {r.status_code}", file=sys.stderr)
                    break
                batch = parse_minstroy_registry_page(r.text, level, page)
            except requests.RequestException as e:
                print(f"  minstroy уровень {level} стр. {page}: {e}", file=sys.stderr)
                break
            if not batch:
                break
            flat.extend(batch)
            level_total += len(batch)
            for rec in batch:
                inn = rec.get("inn")
                if isinstance(inn, str) and inn.strip().isdigit() and len(inn.strip()) >= 10:
                    by_inn[inn.strip()].append(minstroy_slim_for_inn_index(rec))
            if delay_s > 0:
                time.sleep(delay_s)
            print(f"  minstroy: уровень {level}, стр. {page} (+{len(batch)}, всего по уровню {level_total})", file=sys.stderr)
            sys.stderr.flush()
            page += 1

    return flat, dict(by_inn)


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
    ap.add_argument("--skip-minstroy", action="store_true")
    ap.add_argument(
        "--minstroy-levels",
        default="1,2,3,4,5,6",
        help="уровни реестра minstroy.gov.kg (через запятую)",
    )
    ap.add_argument(
        "--minstroy-max-pages",
        type=int,
        default=500,
        help="предохранитель: макс. страниц на один уровень",
    )
    ap.add_argument("--minstroy-delay", type=float, default=0.2)
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
    minstroy_licenses: list[dict] = []
    minstroy_by_inn: dict[str, list[dict]] = {}

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

    if not args.skip_minstroy:
        ms_levels = [int(x.strip()) for x in args.minstroy_levels.split(",") if x.strip()]
        print("Minstroy.gov.kg: реестр лицензий (все страницы по уровням)…", file=sys.stderr)
        minstroy_licenses, minstroy_by_inn = fetch_minstroy_all_levels(
            session,
            ms_levels,
            args.minstroy_max_pages,
            args.minstroy_delay,
        )
        print(f"  всего записей реестра: {len(minstroy_licenses)}, уникальных ИНН: {len(minstroy_by_inn)}", file=sys.stderr)
    else:
        print("Minstroy.gov.kg: пропуск (--skip-minstroy).", file=sys.stderr)

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
            "minstroy": {
                "official_registry_url": f"{MINSTROY_ORIGIN}{MINSTROY_REESTR_RU}",
                "note_ru": "Данные скопированы с публичных страниц реестра Министерства строительства КР. Актуальность уточняйте на minstroy.gov.kg.",
                "licenses": minstroy_licenses,
                "by_inn": minstroy_by_inn,
            },
        },
        "stats": {
            "elitka_objects": len(elitka_raw),
            "elitka_builders": len(elitka_builders),
            "house_kg_companies": len(house_records),
            "2gis_items": len(gis_records),
            "minstroy_license_rows": len(minstroy_licenses),
            "minstroy_unique_inn": len(minstroy_by_inn),
        },
    }

    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print(f"Записано: {args.out}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
