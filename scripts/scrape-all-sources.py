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
  python3 scripts/scrape-all-sources.py --skip-elitka-details   # без /api/objects/{id}
  python3 scripts/scrape-all-sources.py --house-delay 0.4
  python3 scripts/scrape-all-sources.py --passport-scrape       # + HTML паспортов (долго)
  python3 scripts/scrape-all-sources.py --passport-only --merged-in scraped/merged-companies.json --out scraped/merged-companies.json
  python3 scripts/scrape-all-sources.py --passport-only --passport-max 20   # тест на 20 URL
  python3 scripts/scrape-all-sources.py --website-scrape --website-max 10    # снимки официальных сайтов (после merge)
  python3 scripts/scrape-all-sources.py --website-only --merged-in scraped/merged-companies.json --out scraped/merged-companies.json
  python3 scripts/scrape-all-sources.py --website-only --website-workers 12 --website-connect-timeout 5 --website-read-timeout 22
  python3 scripts/scrape-all-sources.py --website-only --website-retry-failed   # только повтор после таймаутов/ошибок
"""

from __future__ import annotations

import argparse
import copy
import json
import os
import random
import re
import sys
import threading
import time
import urllib.parse
import urllib.request
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone

try:
    import requests
    from bs4 import BeautifulSoup
except ImportError:
    print("Установите зависимости: pip install -r scripts/requirements-scrape.txt", file=sys.stderr)
    raise

ELITKA_API = "https://elitka.kg/api/objects"
ELITKA_OBJECT_DETAIL = "https://elitka.kg/api/objects"
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


def html_to_text(html: str | None, limit: int = 4000) -> str | None:
    if not html or not isinstance(html, str):
        return None
    t = re.sub(r"(?is)<script[^>]*>.*?</script>", " ", html)
    t = re.sub(r"(?is)<style[^>]*>.*?</style>", " ", t)
    t = re.sub(r"<[^>]+>", " ", t)
    t = re.sub(r"\s+", " ", t).strip()
    return t[:limit] if t else None


def slim_elitka_builder_profile(bl: dict) -> dict[str, object]:
    out: dict[str, object] = {
        "email": (bl.get("email") or "").strip() or None,
        "phone2": norm_phone(bl.get("phone2")),
        "phone3": norm_phone(bl.get("phone3")),
        "office_address": (bl.get("address") or "").strip() or None,
        "founded_year": bl.get("founded_year"),
        "instagram": bl.get("instagram"),
        "site_url": bl.get("site_url"),
        "inn": str(bl.get("inn")).strip() if bl.get("inn") else None,
        "legal_name_osoo": bl.get("osoo"),
        "photo_file": bl.get("photo"),
        "subscription_plan": bl.get("subscription_plan"),
        "description_text": html_to_text(bl.get("description"), 2800),
    }
    return {k: v for k, v in out.items() if v not in (None, "", [])}


def slim_elitka_characteristics(raw: object) -> list[dict[str, str]] | None:
    if not isinstance(raw, list) or not raw:
        return None
    out: list[dict[str, str]] = []
    for it in raw:
        if not isinstance(it, dict):
            continue
        ch = it.get("characteristic")
        name = None
        if isinstance(ch, dict):
            name = (str(ch.get("name") or "")).strip() or None
        val = it.get("value")
        vs = "" if val is None else str(val).strip()
        if name:
            out.append({"name": name, "value": vs})
    return out or None


def slim_elitka_subdistrict_names(raw: object) -> list[str] | None:
    if not isinstance(raw, list) or not raw:
        return None
    names: list[str] = []
    for it in raw:
        if isinstance(it, dict):
            n = (str(it.get("name") or "")).strip()
            if n:
                names.append(n)
    return names or None


def slim_elitka_other_objects(raw: object) -> list[dict[str, object]] | None:
    if not isinstance(raw, list) or not raw:
        return None
    out: list[dict[str, object]] = []
    for it in raw[:24]:
        if not isinstance(it, dict):
            continue
        oid = it.get("id")
        slug = it.get("slug")
        title = it.get("title")
        if not isinstance(oid, int) or not isinstance(slug, str) or not isinstance(title, str):
            continue
        row: dict[str, object] = {"id": oid, "slug": slug.strip(), "title": title.strip()}
        ad = it.get("address")
        if isinstance(ad, str) and ad.strip():
            row["address"] = ad.strip()
        gs = it.get("gosstroy_registry")
        if isinstance(gs, str) and gs.startswith("http"):
            row["gosstroy_registry"] = gs
        out.append(row)
    return out or None


def slim_elitka_construction_progress(raw: object) -> list[dict[str, object]] | None:
    if not isinstance(raw, list) or not raw:
        return None
    out: list[dict[str, object]] = []
    for it in raw[:72]:
        if not isinstance(it, dict):
            continue
        row: dict[str, object] = {}
        for key in ("date", "title", "percent", "progress", "description", "created_at", "updated_at"):
            v = it.get(key)
            if v is not None and v != "":
                row[key] = v
        if row:
            out.append(row)
    return out or None


def slim_elitka_apartments(raw: object) -> list[dict[str, object]] | None:
    if not isinstance(raw, list) or not raw:
        return None
    out: list[dict[str, object]] = []
    for it in raw[:150]:
        if not isinstance(it, dict):
            continue
        row: dict[str, object] = {}
        for key in (
            "id",
            "floor",
            "rooms",
            "area",
            "living_area",
            "price_usd",
            "price_kgs",
            "title",
            "status",
            "number",
        ):
            v = it.get(key)
            if v is not None and v != "":
                row[key] = v
        if row:
            out.append(row)
    return out or None


def slim_elitka_object_detail(d: dict) -> dict[str, object]:
    room_keys = (
        "one_room_flats",
        "one_room_studio_flats",
        "two_room_flats",
        "two_room_studio_flats",
        "three_room_flats",
        "three_room_studio_flats",
        "four_room_flats",
        "four_room_studio_flats",
        "five_room_flats",
        "five_room_studio_flats",
    )
    slug_v = d.get("slug")
    out: dict[str, object] = {
        "elitka_object_id": d.get("id"),
        "slug": (str(slug_v).strip() if isinstance(slug_v, str) and slug_v.strip() else None),
        "city_id": d.get("city_id"),
        "district_id": d.get("district_id"),
        "blocks_count": d.get("blocks_count"),
        "ceiling_height": d.get("ceiling_height"),
        "lat": d.get("lat"),
        "lon": d.get("lon"),
        "floor_count": d.get("floor_count"),
        "entrances_count": d.get("entrances_count"),
        "object_class": d.get("class"),
        "total_flats": d.get("total_flats"),
        "total_area": d.get("total_area"),
        "land_area": d.get("land_area"),
        "status": d.get("status"),
        "construction_start_date": d.get("construction_start_date"),
        "construction_finish_date": d.get("construction_finish_date"),
        "initial_construction_finish_date": d.get("initial_construction_finish_date"),
        "finish_installment_date": d.get("finish_installment_date"),
        "initial_payment": d.get("initial_payment"),
        "installment_period": d.get("installment_period"),
        "finish_quarter": d.get("finish_quarter"),
        "finish_year": d.get("finish_year"),
        "finish_month": d.get("finish_month"),
        "heat": d.get("heat"),
        "construction_technology": d.get("construction_technology"),
        "wall_material": d.get("wall_material"),
        "underground_parking": d.get("underground_parking"),
        "surface_parking": d.get("surface_parking"),
        "facade": d.get("facade"),
        "reliability_index": d.get("reliability_index"),
        "rating": d.get("rating"),
        "reviews_count": d.get("reviews_count"),
        "quality_score": d.get("quality_score"),
        "view_count": d.get("view_count"),
        "call_count": d.get("call_count"),
        "show_count": d.get("show_count"),
        "is_promoted": d.get("is_promoted"),
        "doc_presentation": d.get("doc_presentation"),
        "doc_state_expertise": d.get("doc_state_expertise"),
        "doc_master_plan": d.get("doc_master_plan"),
        "doc_object_passport": d.get("doc_object_passport"),
        "doc_typical_floor_plan": d.get("doc_typical_floor_plan"),
        "doc_area": d.get("doc_area"),
        "gosstroy_registry": d.get("gosstroy_registry"),
        "labels": d.get("labels"),
        "images": d.get("images"),
        "main_img": d.get("main_img"),
        "price_usd": d.get("price_usd"),
        "price_kgs": d.get("price_kgs"),
        "created_at": d.get("created_at"),
        "updated_at": d.get("updated_at"),
        "description_text": html_to_text(d.get("description"), 4500),
        "client": (str(d.get("client")).strip() if isinstance(d.get("client"), str) and str(d.get("client")).strip() else None),
        "performer": (
            str(d.get("performer")).strip()
            if isinstance(d.get("performer"), str) and str(d.get("performer")).strip()
            else None
        ),
        "approved": d.get("approved") if d.get("approved") is not None else None,
        "safe": d.get("safe") if d.get("safe") is not None else None,
        "is_active": d.get("is_active") if d.get("is_active") is not None else None,
    }
    for k in room_keys:
        v = d.get(k)
        if v is not None and v != 0:
            out[k] = v
    ch = slim_elitka_characteristics(d.get("characteristics"))
    if ch:
        out["characteristics"] = ch
    sn = slim_elitka_subdistrict_names(d.get("subdistricts"))
    if sn:
        out["subdistrict_names"] = sn
    oo = slim_elitka_other_objects(d.get("other_objects"))
    if oo:
        out["related_objects"] = oo
    cp = slim_elitka_construction_progress(d.get("construction_progress"))
    if cp:
        out["construction_progress"] = cp
    apt = slim_elitka_apartments(d.get("apartments"))
    if apt:
        out["apartments"] = apt
    return {k: v for k, v in out.items() if v not in (None, "", [])}


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


def fetch_elitka(
    cities: list[int],
    page_size: int,
    session: requests.Session,
    max_pages: int = 0,
) -> tuple[list[dict], dict[int, dict]]:
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
                        "id": it.get("id"),
                        "title": it.get("title"),
                        "slug": it.get("slug"),
                        "address": it.get("address"),
                        "price_usd_m2": it.get("price_usd"),
                        "price_kgs_m2": it.get("price_kgs"),
                        "gosstroy_registry": it.get("gosstroy_registry"),
                        "finish": it.get("construction_finish_date"),
                        "main_img": it.get("main_img"),
                        "rating": it.get("rating"),
                        "reviews_count": it.get("reviews_count"),
                    }
                )
            total_pages = int(data.get("totalPages") or 0)
            if max_pages > 0 and page >= max_pages:
                break
            if page >= total_pages or not items:
                break
            page += 1
            time.sleep(0.15)

    return raw_objects, builders


def _fetch_elitka_object_detail_once(session: requests.Session, oid: int) -> tuple[dict | None, str]:
    """Возвращает (data, reason). reason: ok | not_found | retry | bad."""
    try:
        r = session.get(f"{ELITKA_OBJECT_DETAIL}/{oid}", timeout=45)
    except requests.RequestException:
        return None, "retry"
    if r.status_code == 404:
        return None, "not_found"
    if r.status_code == 429 or r.status_code >= 500:
        return None, "retry"
    if r.status_code != 200:
        return None, "bad"
    try:
        data = r.json()
    except json.JSONDecodeError:
        return None, "retry"
    if not isinstance(data, dict):
        return None, "bad"
    if data.get("message") == "OBJECT_NOT_FOUND" or data.get("statusCode") == 404:
        return None, "not_found"
    if data.get("statusCode"):
        return None, "bad"
    return data, "ok"


def enrich_elitka_object_details(
    session: requests.Session,
    builders: dict[int, dict],
    raw_objects: list[dict],
    delay: float,
) -> tuple[int, int, int]:
    """GET /api/objects/{id} — полные карточки (ИНН застройщика, координаты, документы, квартирография).

    Возвращает (ok_count, not_found_count, error_count).
    """
    ids_ordered: list[int] = []
    seen: set[int] = set()
    for it in raw_objects:
        oid = it.get("id")
        if isinstance(oid, int) and oid not in seen:
            seen.add(oid)
            ids_ordered.append(oid)
    if not ids_ordered:
        return 0, 0, 0
    print(f"Elitka.kg: детализация /api/objects/{{id}} — {len(ids_ordered)} запросов…", file=sys.stderr)
    details_by_id: dict[int, dict] = {}
    ok = not_found = err = 0
    for i, oid in enumerate(ids_ordered):
        data: dict | None = None
        last_reason = "bad"
        for attempt in range(5):
            chunk, reason = _fetch_elitka_object_detail_once(session, oid)
            last_reason = reason
            if reason == "ok" and chunk:
                data = chunk
                break
            if reason == "not_found":
                break
            if reason == "retry":
                time.sleep(min(8.0, 0.4 * (2**attempt)) + random.random() * 0.2)
                continue
            break
        if data is not None:
            details_by_id[oid] = data
            ok += 1
        elif last_reason == "not_found":
            not_found += 1
        else:
            err += 1
        if delay > 0:
            time.sleep(delay + random.random() * 0.05)
        if (i + 1) % 100 == 0:
            print(f"  elitka detail: {i + 1}/{len(ids_ordered)}", file=sys.stderr)
            sys.stderr.flush()

    profiles: dict[int, dict[str, object]] = {}
    for _oid, d in details_by_id.items():
        bl = d.get("builder") or {}
        bid = bl.get("id")
        if bid is None:
            continue
        prof = slim_elitka_builder_profile(bl)
        cur = profiles.setdefault(int(bid), {})
        for k, v in prof.items():
            if v and not cur.get(k):
                cur[k] = v
            elif k == "inn" and v:
                cur[k] = v

    for bid, b in builders.items():
        if bid in profiles:
            b["builder_detail"] = profiles[bid]

    for b in builders.values():
        for obj in b.get("objects", []):
            oid = obj.get("id")
            if oid not in details_by_id:
                continue
            slab = slim_elitka_object_detail(details_by_id[oid])
            obj["detail"] = slab
            gs = slab.get("gosstroy_registry")
            if isinstance(gs, str) and gs.startswith("http"):
                obj["gosstroy_registry"] = gs

    return ok, not_found, err


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
    intro = soup.select_one(".b-description .desc, .business-description, .company-description, .business-about")
    if intro:
        desc = intro.get_text(" ", strip=True)[:4000]

    logo_url = None
    logo_div = soup.select_one(".main-content.business-profile .left .logo")
    if logo_div and logo_div.get("style"):
        m = re.search(r"url\(\s*['\"]?([^'\")\s]+)", logo_div.get("style", ""))
        if m:
            logo_url = m.group(1).strip()

    banner_url = None
    banner_el = soup.select_one(".b-banner-top")
    if banner_el and banner_el.get("style"):
        m = re.search(r"url\(\s*['\"]?([^'\")\s]+)", banner_el.get("style", ""))
        if m:
            banner_url = m.group(1).strip()

    verified_realtor_assoc = bool(soup.select_one(".verified-label .v-label"))

    rating = None
    score_el = soup.select_one(".rating-block.details-business .rating.score span")
    if score_el:
        try:
            rating = float(score_el.get_text(strip=True).replace(",", "."))
        except ValueError:
            pass

    review_count = None
    rate_a = soup.select_one(".rating-block.details-business .rating.rate-count a")
    if rate_a:
        m = re.search(r"(\d+)", rate_a.get_text())
        if m:
            review_count = int(m.group(1))

    physical_address = None
    adr = soup.select_one(".business-contact .bc-value.adr")
    if adr:
        physical_address = adr.get_text(" ", strip=True)

    work_hours_text = None
    sched = soup.select_one(".business-contact .toggle-gr.opened .bc-value table")
    if sched:
        work_hours_text = re.sub(r"\s+", " ", sched.get_text(" ", strip=True))[:800]

    listing_tab_labels: list[str] = []
    for a in soup.select(".content-tabs-block a"):
        t = a.get_text(" ", strip=True)
        if t:
            listing_tab_labels.append(t)

    filter_listing_count = None
    btn = soup.select_one('input.show-filter-results[value*="объявлен"]')
    if btn and btn.get("value"):
        m = re.search(r"\((\d+)\)", btn["value"])
        if m:
            filter_listing_count = int(m.group(1))

    social: dict[str, str] = {}
    for a in soup.select("a.social-link-builder-details[href]"):
        href = (a.get("href") or "").strip()
        if not href.startswith("/"):
            continue
        if "/facebook" in href:
            social["facebook"] = f"{HOUSE_ORIGIN}{href}"
        elif "/instagram" in href:
            social["instagram"] = f"{HOUSE_ORIGIN}{href}"
        elif "/telegram" in href:
            social["telegram"] = f"{HOUSE_ORIGIN}{href}"
        elif "/whatsapp" in href or "/wa" in href:
            social["whatsapp_contact"] = f"{HOUSE_ORIGIN}{href}"

    product_tier = None
    tier_el = soup.select_one(".b-product-name")
    if tier_el:
        product_tier = tier_el.get_text(" ", strip=True) or None

    return {
        "source": "house.kg",
        "slug": slug,
        "name": title,
        "url": f"{HOUSE_ORIGIN}/{slug}",
        "phones": phones[:8],
        "phone": phones[0] if phones else None,
        "website": website,
        "email": email,
        "description": desc,
        "logo_url": logo_url,
        "banner_url": banner_url,
        "verified_realtor_assoc": verified_realtor_assoc,
        "rating": rating,
        "review_count": review_count,
        "physical_address": physical_address,
        "work_hours_text": work_hours_text,
        "listing_tab_labels": listing_tab_labels or None,
        "filter_listing_count": filter_listing_count,
        "social": social or None,
        "product_tier": product_tier,
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
                    "fields": (
                        "items.point,items.rubrics,items.schedule,items.contact_groups,items.reviews,"
                        "items.org,items.links"
                    ),
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
                review_count = None
                if isinstance(reviews, dict):
                    rating = reviews.get("general_rating") or reviews.get("rating")
                    review_count = reviews.get("general_review_count") or reviews.get("org_review_count")
                rubric_names: list[str] = []
                for rub in raw.get("rubrics") or []:
                    if isinstance(rub, dict) and rub.get("name"):
                        rubric_names.append(str(rub["name"]))
                org = raw.get("org") if isinstance(raw.get("org"), dict) else {}
                items.append(
                    {
                        "source": "2gis.kg",
                        "name": raw.get("name") or raw.get("name_ex"),
                        "address": raw.get("address_name") or raw.get("full_name"),
                        "lat": point.get("lat"),
                        "lng": point.get("lon"),
                        "phones": phones[:8],
                        "phone": norm_phone(phones[0]) if phones else None,
                        "twogisUrl": f"https://2gis.kg/bishkek/firm/{firm_id}" if firm_id else None,
                        "rawId": firm_id or None,
                        "rating": rating,
                        "review_count": review_count,
                        "rubrics": rubric_names[:12] or None,
                        "org_name": org.get("name"),
                        "org_inn": org.get("inn"),
                        "schedule": raw.get("schedule"),
                        "links": raw.get("links"),
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


def normalize_passport_url(url: str) -> str:
    """Канонический ключ для словаря снимков паспорта."""
    u = (url or "").strip()
    if not u.startswith("http"):
        return u.rstrip("/")
    parsed = urllib.parse.urlparse(u)
    path = parsed.path.rstrip("/") or "/"
    return f"{parsed.scheme}://{parsed.netloc.lower()}{path}"


def parse_minstroy_passport_html(html: str) -> dict[str, str]:
    """Парсинг публичной HTML-страницы паспорта объекта (minstroy.gov.kg)."""
    soup = BeautifulSoup(html, "html.parser")
    fields: dict[str, str] = {}
    for block in soup.select("div.flex-block.column-block"):
        label_el = block.select_one(".txt-label")
        if not label_el:
            continue
        label = label_el.get_text(strip=True)
        if not label or "buidlding-" in label:
            continue
        val_el = label_el.find_next_sibling("div")
        if val_el is None:
            continue
        value = val_el.get_text(" ", strip=True)
        if label not in fields:
            fields[label] = value
    for tr in soup.select("table tr"):
        cells = tr.find_all(["td", "th"])
        if len(cells) < 2:
            continue
        label = cells[0].get_text(" ", strip=True).rstrip(":").strip()
        value = cells[1].get_text(" ", strip=True)
        if len(label) < 2 or not value or label in fields:
            continue
        fields[label] = value
    for dl in soup.select("dl"):
        for dt in dl.find_all("dt"):
            dd = dt.find_next_sibling("dd")
            if not dd:
                continue
            label = dt.get_text(" ", strip=True).rstrip(":").strip()
            value = dd.get_text(" ", strip=True)
            if len(label) < 2 or not value or label in fields:
                continue
            fields[label] = value
    return fields


def collect_passport_urls_from_elitka_builders(builders: list) -> list[str]:
    seen: set[str] = set()
    out: list[str] = []
    for b in builders:
        for o in b.get("objects") or []:
            if not isinstance(o, dict):
                continue
            for u in (o.get("gosstroy_registry"),):
                if isinstance(u, str) and u.startswith("http"):
                    nu = normalize_passport_url(u)
                    if nu not in seen:
                        seen.add(nu)
                        out.append(nu)
            d = o.get("detail")
            if isinstance(d, dict):
                u = d.get("gosstroy_registry")
                if isinstance(u, str) and u.startswith("http"):
                    nu = normalize_passport_url(u)
                    if nu not in seen:
                        seen.add(nu)
                        out.append(nu)
    return out


def fetch_minstroy_passport_pages(
    urls: list[str],
    session: requests.Session,
    delay_s: float,
    max_urls: int,
) -> tuple[dict[str, dict], dict[str, int]]:
    """
    Возвращает by_url -> { http_status, error, fields, fetched_at } и счётчики.
    """
    by_url: dict[str, dict] = {}
    stats = {"requested": 0, "ok_200": 0, "http_errors": 0, "fetch_errors": 0}
    limit = len(urls) if max_urls <= 0 else min(len(urls), max_urls)
    for i, url in enumerate(urls[:limit]):
        stats["requested"] += 1
        nu = normalize_passport_url(url)
        rec: dict[str, object] = {
            "http_status": None,
            "error": None,
            "fields": {},
            "fetched_at": datetime.now(timezone.utc).isoformat(),
        }
        try:
            r = session.get(url, timeout=90)
            rec["http_status"] = r.status_code
            if r.status_code == 200:
                rec["fields"] = parse_minstroy_passport_html(r.text)
                stats["ok_200"] += 1
            else:
                rec["error"] = f"HTTP {r.status_code}"
                stats["http_errors"] += 1
        except requests.RequestException as e:
            rec["error"] = str(e)
            stats["fetch_errors"] += 1
        by_url[nu] = rec
        if delay_s > 0:
            time.sleep(delay_s)
        print(f"  паспорт HTML: {i + 1}/{limit} {nu[:72]}…", file=sys.stderr)
        sys.stderr.flush()
    return by_url, stats


def attach_passport_pages_to_payload(
    payload: dict,
    session: requests.Session,
    delay_s: float,
    max_urls: int,
) -> None:
    builders = payload.get("sources", {}).get("elitka", {}).get("builders") or []
    urls = collect_passport_urls_from_elitka_builders(builders)
    print(f"Minstroy.gov.kg: уникальных URL паспортов: {len(urls)}", file=sys.stderr)
    if not urls:
        return
    by_url, stats = fetch_minstroy_passport_pages(urls, session, delay_s, max_urls)
    minst = payload.setdefault("sources", {}).setdefault("minstroy", {})
    minst["passport_pages"] = {
        "note_ru": (
            "Текстовые поля сняты с публичных HTML-страниц паспортов на minstroy.gov.kg. "
            "Не юридическая консультация; актуальность и толкование — только на официальном сайте."
        ),
        "scrapedAt": datetime.now(timezone.utc).isoformat(),
        "stats": stats,
        "by_url": by_url,
    }
    print(
        f"  паспортов сохранено: {stats['ok_200']} OK, HTTP-ошибок: {stats['http_errors']}, сетевых: {stats['fetch_errors']}",
        file=sys.stderr,
    )


# --- Снимки официальных сайтов компаний (тот же origin; без соцсетей и порталов) ---

WEBSITE_BLOCKED_HOST_SUFFIXES: tuple[str, ...] = (
    "instagram.com",
    "facebook.com",
    "fb.com",
    "t.me",
    "telegram.me",
    "telegram.org",
    "wa.me",
    "whatsapp.com",
    "youtube.com",
    "youtu.be",
    "tiktok.com",
    "linkedin.com",
    "twitter.com",
    "x.com",
    "google.com",
    "goo.gl",
    "bit.ly",
)

WEBSITE_SKIP_HOSTS: frozenset[str] = frozenset(
    {
        "house.kg",
        "www.house.kg",
        "elitka.kg",
        "www.elitka.kg",
        "lalafo.kg",
        "www.lalafo.kg",
    }
)

WEBSITE_JSON_LD_TYPES: frozenset[str] = frozenset(
    {
        "Organization",
        "LocalBusiness",
        "RealEstateAgent",
        "Corporation",
        "ProfessionalService",
        "HomeAndConstructionBusiness",
        "Store",
        "WebSite",
    }
)

# Второй заход: только если мало данных из JSON-LD / контактов
WEBSITE_SECOND_HOP_PATHS: tuple[str, ...] = (
    "/contacts",
    "/contact",
    "/kontakty",
    "/about",
    "/o-kompanii",
    "/about-us",
    "/company",
    "/ru/contacts",
    "/ru/contact",
    "/ru/about",
    "/kg/contacts",
    "/en/contacts",
    "/en/contact",
    "/en/about",
)

WEBSITE_MAX_VISIBLE_CHARS = 24000
WEBSITE_MAX_INTERNAL_LINKS = 100
WEBSITE_MAX_SECOND_HOPS = 4


def _website_host(hostname: str | None) -> str:
    if not hostname:
        return ""
    h = hostname.lower()
    return h[4:] if h.startswith("www.") else h


def normalize_company_website_url(raw: object) -> str | None:
    if not isinstance(raw, str):
        return None
    u = raw.strip()
    if not u:
        return None
    if u.startswith("//"):
        u = "https:" + u
    if not re.match(r"^https?://", u, re.I):
        u = "https://" + u
    try:
        p = urllib.parse.urlparse(u)
        if p.scheme not in ("http", "https"):
            return None
        host = _website_host(p.hostname)
        if not host:
            return None
        if host in WEBSITE_SKIP_HOSTS:
            return None
        for suf in WEBSITE_BLOCKED_HOST_SUFFIXES:
            if host == suf or host.endswith("." + suf):
                return None
        return urllib.parse.urlunparse(
            (p.scheme, p.netloc.lower(), p.path or "/", p.params, p.query, "")
        )
    except Exception:
        return None


def canonical_website_key(url: str) -> str:
    try:
        p = urllib.parse.urlparse(url)
        host = _website_host(p.hostname)
        path = (p.path or "/").rstrip("/") or "/"
        return f"{host}{path}"
    except Exception:
        return url


def same_origin(target: str, base: str) -> bool:
    try:
        t = urllib.parse.urlparse(target)
        b = urllib.parse.urlparse(base)
        return _website_host(t.hostname) == _website_host(b.hostname)
    except Exception:
        return False


def collect_company_website_jobs(payload: dict) -> list[tuple[str, str]]:
    jobs: list[tuple[str, str]] = []
    sources = payload.get("sources") or {}
    for b in sources.get("elitka", {}).get("builders") or []:
        if not isinstance(b, dict):
            continue
        bid, slug = b.get("builderId"), b.get("slug")
        if bid is None or not isinstance(slug, str) or not slug:
            continue
        cid = f"elitka-{bid}-{slug}"
        bd = b.get("builder_detail")
        raw = bd.get("site_url") if isinstance(bd, dict) else None
        nu = normalize_company_website_url(raw)
        if nu:
            jobs.append((cid, nu))
    for c in sources.get("house_kg", {}).get("companies") or []:
        if not isinstance(c, dict):
            continue
        slug = c.get("slug")
        if not isinstance(slug, str) or not slug:
            continue
        cid = f"house-kg-{slug}"
        nu = normalize_company_website_url(c.get("website"))
        if nu:
            jobs.append((cid, nu))
    return jobs


def _json_ld_types(node: dict) -> set[str]:
    t = node.get("@type")
    if isinstance(t, str):
        return {t}
    if isinstance(t, list):
        return {str(x) for x in t if x is not None}
    return set()


def _walk_json_ld_collect(node: object, out: list[dict]) -> None:
    if isinstance(node, dict):
        types = _json_ld_types(node)
        if types & WEBSITE_JSON_LD_TYPES or (
            isinstance(node.get("name"), str) and (node.get("url") or node.get("telephone") or node.get("email"))
        ):
            out.append(node)
        g = node.get("@graph")
        if isinstance(g, list):
            for x in g:
                _walk_json_ld_collect(x, out)
        for k, v in node.items():
            if k == "@graph":
                continue
            if isinstance(v, (dict, list)):
                _walk_json_ld_collect(v, out)
    elif isinstance(node, list):
        for x in node:
            _walk_json_ld_collect(x, out)


def _score_json_ld_node(node: dict) -> int:
    types = _json_ld_types(node)
    score = 15 * len(types & WEBSITE_JSON_LD_TYPES)
    if isinstance(node.get("name"), str) and node["name"].strip():
        score += 20
    if isinstance(node.get("legalName"), str) and node["legalName"].strip():
        score += 10
    if isinstance(node.get("description"), str) and len(node["description"].strip()) > 40:
        score += 15
    for k in ("telephone", "email", "address"):
        if node.get(k):
            score += 8
    return score


def _pick_json_ld_node(data: object) -> dict | None:
    candidates: list[dict] = []
    _walk_json_ld_collect(data, candidates)
    if not candidates:
        return None
    best = max(candidates, key=_score_json_ld_node)
    return best if _score_json_ld_node(best) > 0 else None


def _format_postal_address(addr: object) -> str | None:
    if isinstance(addr, str) and addr.strip():
        return addr.strip()
    if not isinstance(addr, dict):
        return None
    parts = [
        addr.get("streetAddress"),
        addr.get("addressLocality"),
        addr.get("addressRegion"),
        addr.get("postalCode"),
        addr.get("addressCountry"),
    ]
    bits = [str(p).strip() for p in parts if p and str(p).strip()]
    return ", ".join(bits) if bits else None


def _fields_from_json_ld_node(node: dict) -> tuple[dict[str, str], list[str]]:
    fields: dict[str, str] = {}
    same_as: list[str] = []
    if isinstance(node.get("name"), str) and node["name"].strip():
        fields["Название (schema.org)"] = node["name"].strip()
    if isinstance(node.get("legalName"), str) and node["legalName"].strip():
        fields["Юр. название"] = node["legalName"].strip()
    if isinstance(node.get("description"), str) and node["description"].strip():
        d = node["description"].strip()
        fields["Описание"] = d[:WEBSITE_MAX_VISIBLE_CHARS]
    tel = node.get("telephone")
    if isinstance(tel, str) and tel.strip():
        fields["Телефон"] = tel.strip()
    elif isinstance(tel, list):
        tels = [str(x).strip() for x in tel if x and str(x).strip()]
        if tels:
            fields["Телефон"] = ", ".join(tels)
    em = node.get("email")
    if isinstance(em, str) and em.strip():
        fields["Email"] = em.strip()
    elif isinstance(em, list):
        ems = [str(x).strip() for x in em if x and str(x).strip()]
        if ems:
            fields["Email"] = ", ".join(ems)
    addr = _format_postal_address(node.get("address"))
    if addr:
        fields["Адрес"] = addr
    url = node.get("url")
    if isinstance(url, str) and url.strip():
        fields["Сайт (schema.org)"] = url.strip()
    sa = node.get("sameAs")
    if isinstance(sa, str) and sa.startswith("http"):
        same_as.append(sa.strip())
    elif isinstance(sa, list):
        for x in sa:
            if isinstance(x, str) and x.startswith("http"):
                same_as.append(x.strip())
    return fields, same_as


def _parse_json_ld_blocks(html: str) -> tuple[dict[str, str], list[str]]:
    soup = BeautifulSoup(html, "html.parser")
    merged: dict[str, str] = {}
    all_same: list[str] = []
    for script in soup.find_all("script", attrs={"type": lambda x: x and "ld+json" in x.lower()}):
        raw = script.string or script.get_text()
        if not raw or not raw.strip():
            continue
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            continue
        node = _pick_json_ld_node(data)
        if not node:
            continue
        f, sa = _fields_from_json_ld_node(node)
        for k, v in f.items():
            if k not in merged or len(v) > len(merged.get(k, "")):
                merged[k] = v
        all_same.extend(sa)
    return merged, list(dict.fromkeys(all_same))


def _visible_text_and_links(html: str, page_url: str) -> tuple[str, list[str]]:
    soup = BeautifulSoup(html, "html.parser")
    for tag in soup(["script", "style", "noscript", "template"]):
        tag.decompose()
    root = (
        soup.find("main")
        or soup.find("article")
        or soup.find(id=re.compile(r"content|main", re.I))
        or soup.find(class_=re.compile(r"content|main|entry", re.I))
        or soup.body
    )
    if not root:
        root = soup
    text = root.get_text("\n", strip=True)
    text = re.sub(r"\n{3,}", "\n\n", text)
    if len(text) > WEBSITE_MAX_VISIBLE_CHARS:
        text = text[: WEBSITE_MAX_VISIBLE_CHARS] + "…"
    internal: list[str] = []
    seen: set[str] = set()
    for a in soup.find_all("a", href=True):
        href = (a.get("href") or "").strip()
        if not href or href.startswith(("#", "javascript:", "mailto:", "tel:")):
            continue
        abs_u = urllib.parse.urljoin(page_url, href)
        if not abs_u.startswith("http"):
            continue
        if not same_origin(abs_u, page_url):
            continue
        low = abs_u.lower()
        if any(
            low.split("?", 1)[0].endswith(ext)
            for ext in (".pdf", ".jpg", ".jpeg", ".png", ".gif", ".webp", ".zip", ".doc", ".docx")
        ):
            continue
        nu = abs_u.split("#", 1)[0]
        if nu not in seen:
            seen.add(nu)
            internal.append(nu)
        if len(internal) >= WEBSITE_MAX_INTERNAL_LINKS:
            break
    return text, internal


def _meta_from_soup(soup: BeautifulSoup) -> dict[str, str]:
    out: dict[str, str] = {}
    for prop in ("og:title", "og:description", "og:site_name", "description"):
        m = soup.find("meta", property=prop) or soup.find("meta", attrs={"name": prop.replace("og:", "")})
        if m and m.get("content"):
            key = "Meta description" if "description" in prop else prop.replace("og:", "Open Graph: ")
            out[key.strip()] = m["content"].strip()[:8000]
    kw = soup.find("meta", attrs={"name": re.compile(r"^keywords$", re.I)})
    if kw and kw.get("content"):
        out["Ключевые слова (meta)"] = kw["content"].strip()[:4000]
    t = soup.find("title")
    if t and t.string and t.string.strip():
        out["Заголовок страницы"] = t.string.strip()[:500]
    return out


def parse_company_page_html(html: str, final_url: str, page_label: str) -> tuple[dict[str, str], list[str]]:
    soup = BeautifulSoup(html, "html.parser")
    jl_fields, jl_same = _parse_json_ld_blocks(html)
    meta = _meta_from_soup(soup)
    visible, internal = _visible_text_and_links(html, final_url)
    fields: dict[str, str] = {}
    prefix = f"{page_label}: " if page_label else ""
    for k, v in jl_fields.items():
        fields[f"{prefix}{k}"] = v
    for k, v in meta.items():
        fields[f"{prefix}{k}"] = v
    if visible.strip():
        fields[f"{prefix}Текст страницы (сайт)"] = visible
    if internal:
        fields[f"{prefix}Внутренние ссылки (тот же сайт)"] = "\n".join(internal)
    return fields, jl_same


def website_json_ld_sparse(fields: dict[str, str]) -> bool:
    """Мало структурированных контактов / описания — имеет смысл второй заход по /contacts, /about."""
    has_org_name = any(
        fields.get(k)
        for k in fields
        if k.endswith("Название (schema.org)") or k == "Название (schema.org)"
    )
    desc_len = max(
        (len((fields.get(k) or "").strip()) for k in fields if "Описание" in k and "Текст страницы" not in k),
        default=0,
    )
    has_contact = any(
        fields.get(k)
        for k in fields
        if k.endswith("Телефон") or k.endswith("Email") or k.endswith("Адрес")
        or k in ("Телефон", "Email", "Адрес")
    )
    if has_org_name and desc_len >= 80 and has_contact:
        return False
    if has_org_name and desc_len >= 120:
        return False
    if not has_org_name and desc_len < 50 and not has_contact:
        return True
    if not has_contact and desc_len < 80:
        return True
    return False


def _website_bot_headers() -> dict[str, str]:
    return {
        "User-Agent": "Mozilla/5.0 (compatible; StroitelnieCatalogBot/1.0; +https://stroitelniekompaniikyrgyzstan.com)",
        "Accept-Language": "ru-RU,ru;q=0.9",
    }


def _new_website_session() -> requests.Session:
    s = requests.Session()
    s.headers.update(_website_bot_headers())
    return s


def fetch_company_website_snapshot(
    session: requests.Session,
    start_url: str,
    inter_request_delay: float,
    second_hop: bool,
    timeout: tuple[float, float],
) -> dict[str, object]:
    rec: dict[str, object] = {
        "requested_url": start_url,
        "final_url": start_url,
        "fetched_at": datetime.now(timezone.utc).isoformat(),
        "http_status": None,
        "error": None,
        "fields": {},
        "same_as": [],
        "extra_pages_fetched": [],
    }
    fields: dict[str, str] = {}
    all_same: list[str] = []
    try:
        r = session.get(start_url, timeout=timeout, allow_redirects=True)
        rec["http_status"] = r.status_code
        rec["final_url"] = r.url
        if r.status_code != 200:
            rec["error"] = f"HTTP {r.status_code}"
            return rec
        f, sa = parse_company_page_html(r.text, r.url, "")
        fields.update(f)
        all_same.extend(sa)
        base_for_origin = r.url

        if second_hop and website_json_ld_sparse(fields):
            fetched_paths: set[str] = set()
            home_path = (urllib.parse.urlparse(base_for_origin).path or "/").rstrip("/") or "/"
            hops = 0
            for path in WEBSITE_SECOND_HOP_PATHS:
                if hops >= WEBSITE_MAX_SECOND_HOPS:
                    break
                pnorm = path if path.startswith("/") else "/" + path
                if pnorm.rstrip("/") == home_path.rstrip("/"):
                    continue
                extra = urllib.parse.urljoin(base_for_origin, pnorm)
                if not same_origin(extra, base_for_origin):
                    continue
                path_key = urllib.parse.urlparse(extra).path or "/"
                if path_key in fetched_paths:
                    continue
                try:
                    if inter_request_delay > 0:
                        time.sleep(inter_request_delay)
                    r2 = session.get(extra, timeout=timeout, allow_redirects=True)
                    if r2.status_code != 200:
                        continue
                    if not same_origin(r2.url, base_for_origin):
                        continue
                    label = urllib.parse.urlparse(r2.url).path or path
                    rec["extra_pages_fetched"].append(r2.url)
                    fetched_paths.add(path_key)
                    f2, sa2 = parse_company_page_html(r2.text, r2.url, f"Страница {label}")
                    for fk, fv in f2.items():
                        if fv and str(fv).strip() and fk not in fields:
                            fields[fk] = fv
                    all_same.extend(sa2)
                    hops += 1
                except requests.Timeout:
                    continue
                except requests.RequestException:
                    continue

        for key, val in list(fields.items()):
            if ": " not in key or not val:
                continue
            short = key.rsplit(": ", 1)[-1]
            if short in ("Телефон", "Email", "Адрес", "Название (schema.org)", "Описание", "Юр. название"):
                if short not in fields or not str(fields.get(short, "")).strip():
                    fields[short] = val

        rec["fields"] = fields
        rec["same_as"] = list(dict.fromkeys(all_same))
    except requests.Timeout:
        rec["error"] = f"Timeout (connect {timeout[0]}s, read {timeout[1]}s)"
    except requests.RequestException as e:
        rec["error"] = str(e)
    return rec


def _website_snapshot_needs_retry(prev: object) -> bool:
    if not isinstance(prev, dict):
        return True
    if prev.get("error"):
        return True
    st = prev.get("http_status")
    if st is not None and st != 200:
        return True
    flds = prev.get("fields")
    if not isinstance(flds, dict) or not any(str(v).strip() for v in flds.values()):
        return True
    return False


def _website_group_needs_retry(group: list[tuple[str, str]], prev_by_id: dict) -> bool:
    for cid, _u in group:
        if _website_snapshot_needs_retry(prev_by_id.get(cid)):
            return True
    return False


def _fetch_one_company_website(
    first_url: str,
    second_hop: bool,
    connect_timeout: float,
    read_timeout: float,
    inter_request_delay: float,
) -> dict[str, object]:
    """Отдельный Session на поток (requests.Session не потокобезопасен)."""
    sess = _new_website_session()
    to = (connect_timeout, read_timeout)
    try:
        return fetch_company_website_snapshot(sess, first_url, inter_request_delay, second_hop, to)
    except Exception as e:
        return {
            "requested_url": first_url,
            "final_url": first_url,
            "fetched_at": datetime.now(timezone.utc).isoformat(),
            "http_status": None,
            "error": str(e),
            "fields": {},
            "same_as": [],
            "extra_pages_fetched": [],
        }


def attach_company_website_snapshots_to_payload(
    payload: dict,
    _session: requests.Session,
    inter_request_delay: float,
    max_unique_urls: int,
    second_hop: bool,
    *,
    workers: int,
    connect_timeout: float,
    read_timeout: float,
    retry_failed_only: bool,
) -> None:
    del _session  # параллельный режим: своя Session в каждом потоке
    jobs = collect_company_website_jobs(payload)
    by_key: dict[str, list[tuple[str, str]]] = defaultdict(list)
    for cid, u in jobs:
        by_key[canonical_website_key(u)].append((cid, u))

    keys_sorted = sorted(by_key.keys())
    if max_unique_urls > 0:
        keys_sorted = keys_sorted[:max_unique_urls]

    prev_block = (payload.get("sources") or {}).get("company_website_snapshots") or {}
    prev_by_id: dict = prev_block.get("by_company_id") if isinstance(prev_block.get("by_company_id"), dict) else {}

    if retry_failed_only:
        by_company_id: dict[str, dict] = copy.deepcopy(prev_by_id)
        keys_to_fetch = [k for k in keys_sorted if _website_group_needs_retry(by_key[k], prev_by_id)]
    else:
        by_company_id = {}
        keys_to_fetch = list(keys_sorted)

    stats = {
        "unique_urls_requested": len(keys_sorted),
        "unique_urls_fetched_this_run": len(keys_to_fetch),
        "companies_mapped": 0,
        "fetch_errors": 0,
        "timeouts": 0,
        "second_hop_enabled": second_hop,
        "workers": max(1, workers),
        "connect_timeout": connect_timeout,
        "read_timeout": read_timeout,
        "retry_failed_only": retry_failed_only,
    }

    w = max(1, min(workers, 32))
    done_lock = threading.Lock()
    done_count = [0]

    def one_key(key: str) -> tuple[str, str, dict[str, object], list[tuple[str, str]]]:
        group = by_key[key]
        _cid0, first_url = group[0]
        snap = _fetch_one_company_website(
            first_url,
            second_hop,
            connect_timeout,
            read_timeout,
            inter_request_delay,
        )
        with done_lock:
            done_count[0] += 1
            n = done_count[0]
        err = snap.get("error")
        flag = f" ⚠ {err[:48]}…" if err and len(str(err)) > 48 else (f" ⚠ {err}" if err else "")
        print(f"  сайт компании: {n}/{len(keys_to_fetch)} {first_url[:64]}…{flag}", file=sys.stderr)
        sys.stderr.flush()
        return key, first_url, snap, group

    results: dict[str, tuple[dict[str, object], list[tuple[str, str]]]] = {}
    if keys_to_fetch:
        with ThreadPoolExecutor(max_workers=w) as ex:
            futures = {ex.submit(one_key, k): k for k in keys_to_fetch}
            for fut in as_completed(futures):
                try:
                    key, _, snap, group = fut.result()
                    results[key] = (snap, group)
                except Exception as e:
                    k = futures[fut]
                    group = by_key[k]
                    _c, first_url = group[0]
                    results[k] = (
                        {
                            "requested_url": first_url,
                            "final_url": first_url,
                            "fetched_at": datetime.now(timezone.utc).isoformat(),
                            "http_status": None,
                            "error": str(e),
                            "fields": {},
                            "same_as": [],
                            "extra_pages_fetched": [],
                        },
                        group,
                    )

    for key in keys_to_fetch:
        if key not in results:
            continue
        snap, group = results[key]
        err = snap.get("error")
        flds = snap.get("fields") if isinstance(snap.get("fields"), dict) else {}
        has_fields = bool(flds and any(str(v).strip() for v in flds.values()))
        if err and not has_fields:
            stats["fetch_errors"] += 1
        if isinstance(err, str) and "timeout" in err.lower():
            stats["timeouts"] += 1
        for cid, orig_url in group:
            one = copy.deepcopy(snap)
            one["requested_url"] = orig_url
            by_company_id[cid] = one
            stats["companies_mapped"] += 1

    if retry_failed_only:
        stats["companies_total_in_output"] = len(by_company_id)
    else:
        stats["companies_total_in_output"] = stats["companies_mapped"]

    payload.setdefault("sources", {})["company_website_snapshots"] = {
        "note_ru": (
            "Текст и метаданные сняты с публичных страниц официальных сайтов (тот же домен; внешние ссылки не обходятся). "
            "Загрузка параллельная; медленные сайты пропускаются по таймауту — повторите с --website-retry-failed. "
            "При неполных данных JSON-LD дополнительно запрашиваются типичные пути (/contacts, /about и т.п.). "
            "Не юридическая проверка; сверяйте с первоисточником."
        ),
        "scrapedAt": datetime.now(timezone.utc).isoformat(),
        "stats": stats,
        "by_company_id": by_company_id,
    }
    print(
        f"  снимки сайтов: обновлено URL за этот прогон {len(keys_to_fetch)}, "
        f"всего карточек в выгрузке {len(by_company_id)}, ошибок/пустых {stats['fetch_errors']}, "
        f"таймаутов ~{stats['timeouts']}, потоков {w}",
        file=sys.stderr,
    )


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
    ap.add_argument(
        "--elitka-max-pages",
        type=int,
        default=0,
        help="ограничить число страниц списка (0 = все; для тестов)",
    )
    ap.add_argument(
        "--skip-elitka-details",
        action="store_true",
        help="не вызывать /api/objects/{id} (меньше полей, быстрее)",
    )
    ap.add_argument("--elitka-detail-delay", type=float, default=0.12, help="пауза между запросами деталей")
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
    ap.add_argument(
        "--passport-scrape",
        action="store_true",
        help="после сборки elitka: скачать HTML паспортов minstroy.gov.kg и разобрать поля (дольше)",
    )
    ap.add_argument("--passport-delay", type=float, default=0.35, help="пауза между запросами паспортов")
    ap.add_argument("--passport-max", type=int, default=0, help="лимит URL паспортов (0 = все уникальные)")
    ap.add_argument(
        "--passport-only",
        action="store_true",
        help="только обновить passport_pages в существующем JSON (--merged-in → --out)",
    )
    ap.add_argument(
        "--merged-in",
        default="scraped/merged-companies.json",
        help="входной JSON для --passport-only и --website-only",
    )
    ap.add_argument(
        "--website-scrape",
        action="store_true",
        help="после сборки merge: скачать главные страницы официальных сайтов (elitka site_url, house.kg website)",
    )
    ap.add_argument(
        "--website-only",
        action="store_true",
        help="только обновить company_website_snapshots в существующем JSON (--merged-in → --out)",
    )
    ap.add_argument(
        "--website-delay",
        type=float,
        default=0,
        help="пауза только между second-hop запросами внутри одной карточки (сек.; при параллели обычно 0)",
    )
    ap.add_argument(
        "--website-max",
        type=int,
        default=0,
        help="лимит уникальных URL сайтов (0 = все; для тестов)",
    )
    ap.add_argument(
        "--website-no-second-hop",
        action="store_true",
        help="не запрашивать /contacts, /about и т.п. при слабом JSON-LD",
    )
    ap.add_argument(
        "--website-workers",
        type=int,
        default=10,
        help="число параллельных потоков загрузки сайтов (1–32)",
    )
    ap.add_argument(
        "--website-connect-timeout",
        type=float,
        default=6,
        help="таймаут установки TCP-соединения (сек.)",
    )
    ap.add_argument(
        "--website-read-timeout",
        type=float,
        default=22,
        help="таймаут чтения ответа на один HTTP-запрос (сек.); при превышении — пропуск, см. --website-retry-failed",
    )
    ap.add_argument(
        "--website-retry-failed",
        action="store_true",
        help="перезагрузить только карточки с ошибкой/таймаутом/пустыми полями (нужен предыдущий company_website_snapshots в JSON)",
    )
    args = ap.parse_args()

    session = requests.Session()
    session.headers.update(
        {
            "User-Agent": "Mozilla/5.0 (compatible; StroitelnieCatalogBot/1.0; +https://stroitelniekompaniikyrgyzstan.com)",
            "Accept-Language": "ru-RU,ru;q=0.9",
        }
    )

    if args.passport_only:
        in_path = os.path.abspath(args.merged_in)
        out_path = os.path.abspath(args.out)
        if not os.path.isfile(in_path):
            print(f"Файл не найден: {in_path}", file=sys.stderr)
            return 1
        with open(in_path, "r", encoding="utf-8") as f:
            payload = json.load(f)
        print("Режим --passport-only: обновление HTML-паспортов Минстроя…", file=sys.stderr)
        attach_passport_pages_to_payload(payload, session, args.passport_delay, args.passport_max)
        out_dir = os.path.dirname(out_path)
        if out_dir:
            os.makedirs(out_dir, exist_ok=True)
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(payload, f, ensure_ascii=False, indent=2)
            f.write("\n")
        print(f"Записано: {out_path}", file=sys.stderr)
        return 0

    if args.website_only:
        in_path = os.path.abspath(args.merged_in)
        out_path = os.path.abspath(args.out)
        if not os.path.isfile(in_path):
            print(f"Файл не найден: {in_path}", file=sys.stderr)
            return 1
        with open(in_path, "r", encoding="utf-8") as f:
            payload = json.load(f)
        print("Режим --website-only: снимки официальных сайтов компаний…", file=sys.stderr)
        attach_company_website_snapshots_to_payload(
            payload,
            session,
            args.website_delay,
            args.website_max,
            second_hop=not args.website_no_second_hop,
            workers=args.website_workers,
            connect_timeout=args.website_connect_timeout,
            read_timeout=args.website_read_timeout,
            retry_failed_only=args.website_retry_failed,
        )
        out_dir = os.path.dirname(out_path)
        if out_dir:
            os.makedirs(out_dir, exist_ok=True)
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(payload, f, ensure_ascii=False, indent=2)
            f.write("\n")
        print(f"Записано: {out_path}", file=sys.stderr)
        return 0

    cities = [int(x.strip()) for x in args.elitka_cities.split(",") if x.strip()]
    elitka_raw: list[dict] = []
    elitka_builders: dict[int, dict] = {}
    house_records: list[dict] = []
    gis_records: list[dict] = []
    minstroy_licenses: list[dict] = []
    minstroy_by_inn: dict[str, list[dict]] = {}
    elitka_detail_ok = 0
    elitka_detail_not_found = 0
    elitka_detail_err = 0

    if not args.skip_elitka:
        print("Elitka.kg: загрузка объектов…", file=sys.stderr)
        elitka_raw, elitka_builders = fetch_elitka(
            cities,
            args.elitka_page_size,
            session,
            max_pages=args.elitka_max_pages,
        )
        print(f"  объектов: {len(elitka_raw)}, уникальных застройщиков: {len(elitka_builders)}", file=sys.stderr)
        if not args.skip_elitka_details and elitka_raw:
            elitka_detail_ok, elitka_detail_not_found, elitka_detail_err = enrich_elitka_object_details(
                session,
                elitka_builders,
                elitka_raw,
                args.elitka_detail_delay,
            )
            print(
                f"  детализация объектов: OK {elitka_detail_ok}, нет в API {elitka_detail_not_found}, ошибок {elitka_detail_err}",
                file=sys.stderr,
            )
        elif args.skip_elitka_details:
            print("Elitka.kg: детализация пропущена (--skip-elitka-details).", file=sys.stderr)

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
            "project_cross_listings": {
                "note_ru": "Опционально: объявления с других площадок, сопоставленные с id объекта elitka (эвристика). Заполняется отдельным процессом.",
                "by_elitka_object_id": {},
            },
        },
        "stats": {
            "elitka_objects": len(elitka_raw),
            "elitka_builders": len(elitka_builders),
            "elitka_object_details_ok": elitka_detail_ok,
            "elitka_object_details_not_found": elitka_detail_not_found,
            "elitka_object_details_err": elitka_detail_err,
            "house_kg_companies": len(house_records),
            "2gis_items": len(gis_records),
            "minstroy_license_rows": len(minstroy_licenses),
            "minstroy_unique_inn": len(minstroy_by_inn),
        },
    }

    if args.passport_scrape:
        print("Minstroy.gov.kg: загрузка HTML паспортов объектов…", file=sys.stderr)
        attach_passport_pages_to_payload(payload, session, args.passport_delay, args.passport_max)

    if args.website_scrape:
        print("Официальные сайты компаний: загрузка страниц…", file=sys.stderr)
        attach_company_website_snapshots_to_payload(
            payload,
            session,
            args.website_delay,
            args.website_max,
            second_hop=not args.website_no_second_hop,
            workers=args.website_workers,
            connect_timeout=args.website_connect_timeout,
            read_timeout=args.website_read_timeout,
            retry_failed_only=args.website_retry_failed,
        )

    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print(f"Записано: {args.out}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
