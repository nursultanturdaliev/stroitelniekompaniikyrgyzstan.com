#!/usr/bin/env python3
"""
Выгрузка организаций из 2GIS Catalog API (v3) в JSON для последующей ручной курации в companies.ts.

Требуется API-ключ: https://docs.2gis.com/api/search/overview
  export TWO_GIS_API_KEY="ваш_ключ"
  export TWO_GIS_REGION_ID="1"   # при необходимости смените регион

Запуск:
  python3 scripts/scrape-2gis.py --query "строительная компания" --city "Бишкек"
  python3 scripts/scrape-2gis.py --query "ремонт квартир" --out scraped-companies.json

Без ключа скрипт создаёт пример выходного файла с пояснением.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.parse
import urllib.request


API_BASE = "https://catalog.api.2gis.com/3.0/items"


def fetch_items(api_key: str, query: str, region_id: str, page: int, page_size: int) -> dict:
    params = urllib.parse.urlencode(
        {
            "q": query,
            "region_id": region_id,
            "page": page,
            "page_size": page_size,
            "fields": "items.point,items.rubrics,items.schedule,items.contact_groups,items.reviews",
            "key": api_key,
        }
    )
    url = f"{API_BASE}?{params}"
    req = urllib.request.Request(url, headers={"User-Agent": "stroitelniekompaniikyrgyzstan-catalog/1.0"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def normalize_item(raw: dict) -> dict:
    """Упрощённая нормализация под будущий импорт в TypeScript."""
    point = raw.get("point") or {}
    lon = point.get("lon")
    lat = point.get("lat")
    name = raw.get("name") or raw.get("name_ex") or "Без названия"
    address = raw.get("address_name") or raw.get("full_name") or ""
    firm_id = raw.get("id")
    twogis_url = f"https://2gis.kg/bishkek/firm/{firm_id}" if firm_id else ""

    phones = []
    for group in raw.get("contact_groups") or []:
        for c in group.get("contacts") or []:
            if c.get("type") == "phone":
                v = c.get("value")
                if v:
                    phones.append(v)

    rating = None
    reviews = raw.get("reviews") or {}
    if isinstance(reviews, dict):
        rating = reviews.get("general_rating") or reviews.get("rating")

    return {
        "name": name,
        "address": address,
        "lat": lat,
        "lng": lon,
        "phones": phones[:3],
        "twogisUrl": twogis_url,
        "rating": rating,
        "rawId": str(firm_id) if firm_id else None,
    }


def write_sample(out_path: str) -> None:
    sample = {
        "_comment": "Пример структуры после курации. Получите TWO_GIS_API_KEY и запустите скрипт снова.",
        "query": "строительная компания Бишкек",
        "items": [
            {
                "name": "Пример Строй ООО",
                "address": "г. Бишкек, ул. Примерная, 1",
                "lat": 42.87,
                "lng": 74.59,
                "phones": ["+996 555 000000"],
                "twogisUrl": "https://2gis.kg/bishkek/firm/70000000000000000",
                "rating": 4.5,
                "rawId": "70000000000000000",
            }
        ],
    }
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(sample, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print(f"Записан пример: {out_path}")


def main() -> int:
    parser = argparse.ArgumentParser(description="2GIS → JSON для каталога строительных компаний")
    parser.add_argument("--query", default="строительная компания", help="Поисковый запрос")
    parser.add_argument("--city", default="", help="Добавляется к запросу")
    parser.add_argument("--region-id", default=os.environ.get("TWO_GIS_REGION_ID", "1"))
    parser.add_argument("--pages", type=int, default=1, help="Количество страниц API")
    parser.add_argument("--page-size", type=int, default=10)
    parser.add_argument("--out", default="scraped-companies.json")
    args = parser.parse_args()

    api_key = os.environ.get("TWO_GIS_API_KEY", "").strip()
    full_query = f"{args.query} {args.city}".strip()

    if not api_key:
        print("Переменная TWO_GIS_API_KEY не задана — создаю пример файла.", file=sys.stderr)
        write_sample(args.out)
        return 0

    all_items = []
    for page in range(1, args.pages + 1):
        try:
            data = fetch_items(api_key, full_query, str(args.region_id), page, args.page_size)
        except Exception as e:
            print(f"Ошибка запроса 2GIS: {e}", file=sys.stderr)
            return 1
        meta = data.get("result") or {}
        items = meta.get("items") or []
        if not items:
            break
        for it in items:
            all_items.append(normalize_item(it))

    out = {
        "query": full_query,
        "region_id": args.region_id,
        "count": len(all_items),
        "items": all_items,
    }
    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print(f"Сохранено {len(all_items)} записей в {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
