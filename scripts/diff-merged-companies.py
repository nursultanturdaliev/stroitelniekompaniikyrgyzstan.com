#!/usr/bin/env python3
"""
Сравнение двух выгрузок merged-companies.json (elitka-объекты по id).

Пример:
  python3 scripts/diff-merged-companies.py \\
    --old scraped/merged-companies.prev.json \\
    --new scraped/merged-companies.json \\
    --out src/data/mergeChangelog.json

CI: сохраните предыдущий JSON как артефакт или committed prev, затем запускайте после scrape.
При первом запуске можно указать один и тот же файл для old/new — получите пустой diff.

Выход: JSON для статического сайта (импорт в Next как mergeChangelog.json).
"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


def _str(v: Any) -> str | None:
    if v is None:
        return None
    if isinstance(v, str):
        t = v.strip()
        return t if t else None
    return str(v)


def object_snapshot(obj: dict[str, Any]) -> dict[str, Any]:
    d = obj.get("detail") if isinstance(obj.get("detail"), dict) else {}
    reg = _str(obj.get("gosstroy_registry")) or _str(d.get("gosstroy_registry"))
    return {
        "title": _str(obj.get("title")),
        "address": _str(obj.get("address")),
        "price_usd_m2": _str(obj.get("price_usd_m2")),
        "price_kgs_m2": _str(obj.get("price_kgs_m2")),
        "finish": _str(obj.get("finish")),
        "gosstroy_registry": reg,
        "status": _str(d.get("status")),
        "construction_finish_date": _str(d.get("construction_finish_date")),
        "construction_start_date": _str(d.get("construction_start_date")),
        "initial_construction_finish_date": _str(d.get("initial_construction_finish_date")),
        "lat": d.get("lat"),
        "lon": d.get("lon"),
    }


def index_elitka_objects(payload: dict[str, Any]) -> dict[int, dict[str, Any]]:
    out: dict[int, dict[str, Any]] = {}
    builders = (
        payload.get("sources", {})
        .get("elitka", {})
        .get("builders", [])
    )
    if not isinstance(builders, list):
        return out
    for b in builders:
        if not isinstance(b, dict):
            continue
        bslug = _str(b.get("slug")) or ""
        bname = _str(b.get("name")) or ""
        for obj in b.get("objects") or []:
            if not isinstance(obj, dict):
                continue
            oid = obj.get("id")
            if not isinstance(oid, int):
                continue
            row = {
                "object": obj,
                "builder_slug": bslug,
                "builder_name": bname,
            }
            out[oid] = row
    return out


def field_diff(
    old_snap: dict[str, Any],
    new_snap: dict[str, Any],
) -> list[dict[str, Any]]:
    changes: list[dict[str, Any]] = []
    keys = set(old_snap.keys()) | set(new_snap.keys())
    labels = {
        "title": "Название",
        "address": "Адрес",
        "price_usd_m2": "Цена $/м² (список)",
        "price_kgs_m2": "Цена сом/м² (список)",
        "finish": "Дата finish (список)",
        "gosstroy_registry": "Паспорт / gosstroy_registry",
        "status": "Статус строительства",
        "construction_finish_date": "План сдачи (detail)",
        "construction_start_date": "План начала (detail)",
        "initial_construction_finish_date": "Исходная плановая сдача",
        "lat": "Широта",
        "lon": "Долгота",
    }
    for k in sorted(keys):
        a, b = old_snap.get(k), new_snap.get(k)
        if a == b:
            continue
        changes.append(
            {
                "field": k,
                "label": labels.get(k, k),
                "from": a,
                "to": b,
            }
        )
    return changes


def main() -> int:
    ap = argparse.ArgumentParser(description="Diff two merged-companies.json (elitka objects)")
    ap.add_argument("--old", required=True, type=Path, help="Предыдущая выгрузка")
    ap.add_argument("--new", required=True, type=Path, help="Новая выгрузка")
    ap.add_argument("--out", required=True, type=Path, help="mergeChangelog.json")
    ap.add_argument("--max-changed", type=int, default=500, help="Макс. записей в changed (остальное в changedTruncated)")
    args = ap.parse_args()

    old_raw = json.loads(args.old.read_text(encoding="utf-8"))
    new_raw = json.loads(args.new.read_text(encoding="utf-8"))
    if not isinstance(old_raw, dict) or not isinstance(new_raw, dict):
        print("Invalid JSON root", file=sys.stderr)
        return 1

    old_idx = index_elitka_objects(old_raw)
    new_idx = index_elitka_objects(new_raw)

    old_ids = set(old_idx.keys())
    new_ids = set(new_idx.keys())

    added_ids = sorted(new_ids - old_ids)
    removed_ids = sorted(old_ids - new_ids)
    common = old_ids & new_ids

    added: list[dict[str, Any]] = []
    for oid in added_ids:
        meta = new_idx[oid]
        obj = meta["object"]
        title = _str(obj.get("title")) or f"#{oid}"
        added.append(
            {
                "id": oid,
                "title": title,
                "builderSlug": meta["builder_slug"],
                "builderName": meta["builder_name"],
                "path": f"/projects/elitka-{oid}/",
            }
        )

    removed: list[dict[str, Any]] = []
    for oid in removed_ids:
        meta = old_idx[oid]
        obj = meta["object"]
        title = _str(obj.get("title")) or f"#{oid}"
        removed.append(
            {
                "id": oid,
                "title": title,
                "builderSlug": meta["builder_slug"],
                "builderName": meta["builder_name"],
            }
        )

    changed_full: list[dict[str, Any]] = []
    for oid in sorted(common):
        o_obj = old_idx[oid]["object"]
        n_obj = new_idx[oid]["object"]
        osnap = object_snapshot(o_obj)
        nsnap = object_snapshot(n_obj)
        diffs = field_diff(osnap, nsnap)
        if not diffs:
            continue
        changed_full.append(
            {
                "id": oid,
                "title": _str(n_obj.get("title")) or f"#{oid}",
                "builderSlug": new_idx[oid]["builder_slug"],
                "builderName": new_idx[oid]["builder_name"],
                "path": f"/projects/elitka-{oid}/",
                "fields": diffs,
            }
        )

    truncated = 0
    if len(changed_full) > args.max_changed:
        truncated = len(changed_full) - args.max_changed
        changed_out = changed_full[: args.max_changed]
    else:
        changed_out = changed_full

    out_obj = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "fromScrapedAt": old_raw.get("scrapedAt"),
        "toScrapedAt": new_raw.get("scrapedAt"),
        "summary": {
            "added": len(added),
            "removed": len(removed),
            "changed": len(changed_full),
            "changedShown": len(changed_out),
            "changedTruncated": truncated,
        },
        "added": added,
        "removed": removed,
        "changed": changed_out,
        "noteRu": (
            "Автоматическое сравнение двух JSON-выгрузок. Не официальное уведомление ведомств и не полный список "
            "юридически значимых изменений."
        ),
    }

    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(out_obj, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(
        f"Wrote {args.out}: +{len(added)} -{len(removed)} ~{len(changed_full)} changed",
        file=sys.stderr,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
