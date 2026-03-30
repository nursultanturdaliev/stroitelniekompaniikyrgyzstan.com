#!/usr/bin/env node
/**
 * Читает scraped/merged-companies.json и пишет src/data/dataQualityStats.json
 * для блока «качество выгрузки» на /updates/ и в методологии.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const mergedPath = join(root, "scraped", "merged-companies.json");
const outPath = join(root, "src", "data", "dataQualityStats.json");

function normalizeMinstroyPassportUrl(url) {
  const u = url.trim();
  if (!u.startsWith("http")) return u.replace(/\/$/, "");
  try {
    const parsed = new URL(u);
    const path = parsed.pathname.replace(/\/$/, "") || "/";
    return `${parsed.protocol}//${parsed.hostname.toLowerCase()}${path}`;
  } catch {
    return u.replace(/\/$/, "");
  }
}

function passportEntryForUrl(merged, url) {
  if (!url || !url.startsWith("http")) return undefined;
  const by = merged?.sources?.minstroy?.passport_pages?.by_url;
  if (!by || typeof by !== "object") return undefined;
  const nu = normalizeMinstroyPassportUrl(url);
  const direct = by[nu];
  if (direct) return direct;
  const m = url.match(/\/(?:legal|passport)\/(?:legal\/)?(\d+)/i) ?? url.match(/\/legal\/(\d+)/i);
  const id = m?.[1];
  if (!id) return undefined;
  for (const k of Object.keys(by)) {
    if (k.includes(`/legal/${id}`)) return by[k];
  }
  return undefined;
}

function entryHasSnapshot(entry) {
  if (!entry || typeof entry !== "object") return false;
  const fields = entry.fields;
  if (fields && typeof fields === "object" && Object.keys(fields).length > 0) return true;
  if (entry.error) return true;
  return false;
}

function main() {
  const raw = readFileSync(mergedPath, "utf8");
  const merged = JSON.parse(raw);
  const scrapedAt = typeof merged.scrapedAt === "string" ? merged.scrapedAt : null;
  const builders = merged?.sources?.elitka?.builders;
  if (!Array.isArray(builders)) {
    throw new Error("Invalid merged JSON: sources.elitka.builders");
  }

  const seen = new Set();
  let elitkaObjectCount = 0;
  let withPassportUrlCount = 0;
  let withPassportSnapshotCount = 0;

  for (const b of builders) {
    const objects = b?.objects;
    if (!Array.isArray(objects)) continue;
    for (const o of objects) {
      if (typeof o?.id !== "number" || seen.has(o.id)) continue;
      seen.add(o.id);
      elitkaObjectCount += 1;
      const d = o.detail && typeof o.detail === "object" ? o.detail : {};
      const regFromDetail =
        typeof d.gosstroy_registry === "string" && d.gosstroy_registry.startsWith("http") ? d.gosstroy_registry : null;
      const regFromList =
        typeof o.gosstroy_registry === "string" && o.gosstroy_registry.startsWith("http") ? o.gosstroy_registry : null;
      const url = regFromDetail || regFromList;
      if (url) withPassportUrlCount += 1;
      const entry = passportEntryForUrl(merged, url);
      if (entryHasSnapshot(entry)) withPassportSnapshotCount += 1;
    }
  }

  const stats = {
    generatedAt: new Date().toISOString(),
    scrapedAt,
    elitkaObjectCount,
    withPassportUrlCount,
    withPassportSnapshotCount,
    noteRu:
      "Доля со снимком паспорта зависит от прогона scrape с --passport-scrape / passport-only. Без снимка в JSON карточка всё равно может иметь ссылку на официальную страницу Минстроя.",
  };

  writeFileSync(outPath, `${JSON.stringify(stats, null, 2)}\n`, "utf8");
  console.log(`Wrote ${outPath}`);
}

main();
