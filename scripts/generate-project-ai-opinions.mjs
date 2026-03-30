#!/usr/bin/env node
/**
 * Generate per-object AI opinions locally (no external API) and write src/data/projectAiOpinions.json
 *
 * Usage:
 *   npm run ai:opinions
 *   npm run ai:opinions -- --limit 50
 *   npm run ai:opinions -- --only-missing
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const mergedPath = join(root, "scraped", "merged-companies.json");
const outPath = join(root, "src", "data", "projectAiOpinions.json");

function parseArgs(argv) {
  const out = { limit: null, onlyMissing: false };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--only-missing") out.onlyMissing = true;
    if (a === "--limit") {
      const raw = argv[i + 1];
      const n = Number.parseInt(raw ?? "", 10);
      if (Number.isFinite(n) && n > 0) out.limit = n;
      i += 1;
    }
  }
  return out;
}

function normalizeList(value, max = 4) {
  if (!Array.isArray(value)) return [];
  return value
    .map((x) => (typeof x === "string" ? x.trim() : ""))
    .filter(Boolean)
    .slice(0, max);
}

function normalizeLocationOpinion(value) {
  if (!value || typeof value !== "object") return undefined;
  const v = value;
  const summary = typeof v.summary === "string" ? v.summary.trim() : "";
  const airAndClimate = normalizeList(v.airAndClimate, 4);
  const transportAndNoise = normalizeList(v.transportAndNoise, 4);
  const localChecks = normalizeList(v.localChecks, 4);
  if (!summary && airAndClimate.length === 0 && transportAndNoise.length === 0 && localChecks.length === 0) {
    return undefined;
  }
  return {
    summary: summary || "Смотрите район и условия на месте в разное время дня.",
    airAndClimate,
    transportAndNoise,
    localChecks,
  };
}

function loadObjects() {
  const merged = JSON.parse(readFileSync(mergedPath, "utf8"));
  const builders = merged?.sources?.elitka?.builders;
  if (!Array.isArray(builders)) throw new Error("Invalid merged JSON: sources.elitka.builders");
  const rows = [];
  for (const b of builders) {
    const objs = b?.objects;
    if (!Array.isArray(objs)) continue;
    for (const o of objs) {
      if (typeof o?.id !== "number") continue;
      const d = o?.detail && typeof o.detail === "object" ? o.detail : {};
      rows.push({
        projectId: `elitka-${o.id}`,
        title: String(o.title || "").trim(),
        builderName: String(b?.name || "").trim(),
        address: String(o.address || "").trim(),
        statusCode: typeof d.status === "string" ? d.status : null,
        cityId: typeof d.city_id === "number" ? Math.round(d.city_id) : null,
        districtId: typeof d.district_id === "number" ? Math.round(d.district_id) : null,
        priceUsdM2: String(o.price_usd_m2 || "").trim(),
        priceKgsM2: String(o.price_kgs_m2 || "").trim(),
        passportUrl: typeof d.gosstroy_registry === "string" ? d.gosstroy_registry : typeof o.gosstroy_registry === "string" ? o.gosstroy_registry : null,
        finish: typeof d.construction_finish_date === "string" ? d.construction_finish_date : typeof o.finish === "string" ? o.finish : null,
        lat: typeof d.lat === "number" ? d.lat : null,
        lng: typeof d.lon === "number" ? d.lon : null,
      });
    }
  }
  return rows;
}

function loadExisting() {
  try {
    return JSON.parse(readFileSync(outPath, "utf8"));
  } catch {
    return {};
  }
}

function isPresent(v) {
  if (v == null) return false;
  const s = String(v).trim();
  return s.length > 0 && s !== "0";
}

function localOpinion(row) {
  const positives = [];
  const cautions = [];
  const questions = [];
  const airAndClimate = [];
  const transportAndNoise = [];
  const localChecks = [];

  let score = 50;

  if (isPresent(row.passportUrl)) {
    positives.push("Есть ссылка на паспорт объекта в данных карточки.");
    score += 12;
  } else {
    cautions.push("Нет ссылки на паспорт объекта в данных.");
    questions.push("Запросите официальный URL паспорта на minstroy.gov.kg.");
    score -= 12;
  }

  if (isPresent(row.priceUsdM2) && isPresent(row.priceKgsM2)) {
    positives.push("Есть ориентиры цены в $/м² и в сом/м².");
    questions.push("Уточните в договоре курс и дату фиксации цены.");
    score += 8;
  } else if (isPresent(row.priceUsdM2) || isPresent(row.priceKgsM2)) {
    cautions.push("Цена указана не в обеих валютах; возможны разночтения.");
    score -= 2;
  } else {
    cautions.push("В карточке нет ясного ориентира цены.");
    score -= 8;
  }

  if (isPresent(row.finish)) {
    positives.push("Есть ориентир по сроку завершения в открытых данных.");
    score += 5;
  } else {
    cautions.push("Срок завершения не указан.");
    score -= 5;
  }

  if (row.statusCode === "SUSPENDED") {
    cautions.push("Статус объекта в данных: приостановлен.");
    questions.push("Уточните официальное основание и срок возобновления.");
    score -= 14;
  } else if (row.statusCode === "PLANNED") {
    cautions.push("Статус в данных: запланирован (ранняя стадия).");
    score -= 4;
  } else if (row.statusCode === "IN_PROGRESS") {
    positives.push("Статус в данных: в строительстве.");
    score += 2;
  } else if (row.statusCode === "COMPLETED") {
    positives.push("Статус в данных: завершён.");
    questions.push("Сверьте фактическую передачу и условия по документам.");
    score += 3;
  }

  if (row.cityId === 1) {
    airAndClimate.push("Бишкек: зимой бывают периоды смога и инверсии в отдельных районах.");
    transportAndNoise.push("Проверьте объект в часы пик: шум магистралей и время в пути могут сильно отличаться.");
    localChecks.push("Посмотрите двор и подъезды вечером, а не только днём.");
  } else if (row.cityId === 2) {
    airAndClimate.push("Ош: сухой сезон может усиливать пыль возле дорог и строек.");
    transportAndNoise.push("Проверьте реальные маршруты и время до ключевых точек в городе.");
    localChecks.push("Оцените шум улицы утром и вечером непосредственно на месте.");
  } else {
    airAndClimate.push("По региону: учитывайте сезонность, пыль/ветер и микроклимат локации.");
    transportAndNoise.push("Проверьте доступность транспорта и подъездные пути зимой.");
    localChecks.push("Осмотрите район в разное время суток и в будний день.");
  }

  if (row.lat == null || row.lng == null) {
    cautions.push("Нет точных координат объекта в данных.");
    questions.push("Уточните точный пин локации и границы участка.");
    score -= 3;
  } else {
    positives.push("Есть координаты для проверки окружения на карте.");
    score += 3;
  }

  score = Math.max(0, Math.min(100, score));
  const confidence = score >= 72 ? "high" : score >= 48 ? "medium" : "low";
  const summary =
    score >= 72
      ? "Объект выглядит достаточно прозрачным по открытым данным, но финальное решение — только после проверки документов."
      : score >= 48
        ? "Есть базовая информация для сравнения, но перед сделкой нужна дополнительная проверка ключевых пунктов."
        : "По карточке мало подтверждающих сигналов: проверку паспорта, цены и контрагента лучше провести максимально тщательно.";

  return {
    summary,
    positives: positives.slice(0, 4),
    cautions: cautions.slice(0, 4),
    questions: questions.slice(0, 4),
    locationOpinion: normalizeLocationOpinion({
      summary: "Локацию оценивайте на месте: карта и описание полезны, но не заменяют живой осмотр.",
      airAndClimate,
      transportAndNoise,
      localChecks,
    }),
    confidence,
    model: "local-rule-engine-v1",
    generatedAt: new Date().toISOString(),
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const all = loadObjects();
  const existing = loadExisting();
  const queue = args.onlyMissing ? all.filter((r) => !existing[r.projectId]) : all;
  const rows = args.limit ? queue.slice(0, args.limit) : queue;

  console.log(`Objects: ${all.length}. To process: ${rows.length}.`);

  const out = { ...existing };
  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    try {
      const opinion = localOpinion(row);
      out[row.projectId] = opinion;
      if ((i + 1) % 10 === 0 || i === rows.length - 1) {
        writeFileSync(outPath, `${JSON.stringify(out, null, 2)}\n`, "utf8");
      }
      console.log(`[${i + 1}/${rows.length}] ${row.projectId} OK`);
    } catch (err) {
      console.error(`[${i + 1}/${rows.length}] ${row.projectId} FAILED: ${String(err)}`);
    }
  }

  writeFileSync(outPath, `${JSON.stringify(out, null, 2)}\n`, "utf8");
  console.log(`Done. Wrote ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
