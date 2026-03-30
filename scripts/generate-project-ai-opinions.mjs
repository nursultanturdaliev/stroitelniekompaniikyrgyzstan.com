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

function normalizeSubdistrictNames(d) {
  const raw = d.subdistrict_names;
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((x) => typeof x === "string" && x.trim() !== "")
    .map((x) => x.trim())
    .slice(0, 8);
}

/** Deterministic hash for stable per-project wording. */
function djb2(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i += 1) h = (h * 33) ^ str.charCodeAt(i);
  return h >>> 0;
}

function pick(rowKey, slot, arr) {
  if (!arr.length) return "";
  return arr[djb2(`${rowKey}\0${slot}`) % arr.length];
}

/** Up to `count` distinct picks from arr (by rotating index from hash). */
function pickMany(rowKey, slot, arr, count) {
  if (!arr.length) return [];
  const h = djb2(`${rowKey}\0${slot}`);
  const out = [];
  const n = Math.min(count, arr.length);
  for (let k = 0; k < n; k += 1) {
    const idx = (h + k * 7) % arr.length;
    const s = arr[idx];
    if (!out.includes(s)) out.push(s);
  }
  let extra = 0;
  while (out.length < n && extra < arr.length) {
    const s = arr[extra % arr.length];
    if (!out.includes(s)) out.push(s);
    extra += 1;
  }
  return out;
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
        subdistrictNames: normalizeSubdistrictNames(d),
        priceUsdM2: String(o.price_usd_m2 || "").trim(),
        priceKgsM2: String(o.price_kgs_m2 || "").trim(),
        passportUrl:
          typeof d.gosstroy_registry === "string"
            ? d.gosstroy_registry
            : typeof o.gosstroy_registry === "string"
              ? o.gosstroy_registry
              : null,
        finish:
          typeof d.construction_finish_date === "string"
            ? d.construction_finish_date
            : typeof o.finish === "string"
              ? o.finish
              : null,
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

/** Readable date for opinion text (falls back to raw string). */
function formatFinishRu(finish) {
  if (!finish || typeof finish !== "string") return null;
  const t = Date.parse(finish);
  if (!Number.isFinite(t)) return finish.trim();
  try {
    return new Intl.DateTimeFormat("ru-RU", { year: "numeric", month: "long", day: "numeric" }).format(new Date(t));
  } catch {
    return finish.trim();
  }
}

function cityLabel(row) {
  if (row.cityId === 1) return "Бишкек";
  if (row.cityId === 2) return "Ош";
  if (row.cityId != null) return `город (id ${row.cityId})`;
  return "регион без id города в данных";
}

function statusPhraseRu(code) {
  let s;
  if (code === "SUSPENDED") s = "в данных указан статус приостановки";
  else if (code === "PLANNED") s = "в данных объект на ранней стадии (запланирован)";
  else if (code === "IN_PROGRESS") s = "в данных статус — строительство";
  else if (code === "COMPLETED") s = "в данных статус — завершён";
  else if (code) s = `в данных статус: ${code}`;
  else s = "поле статуса в выгрузке пустое";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const BISHKEK_AIR = [
  "Зимой в Бишкеке полезно оценить район при инверсии: локально качество воздуха может заметно отличаться.",
  "На открытых фасадах и у магистралей летом сильнее ощущаются пыль и выхлоп — сравните этаж и сторону света.",
  "Если рядом стройки или пустыри, в сухую погоду пыль может усиливаться — загляните в разное время года.",
  "Проверьте проветривание квартиры и тень от соседних домов: это влияет на комфорт в жару и при смоге.",
];

const BISHKEK_TRANSPORT = [
  "Снимите маршрут в часы пик: до центра и основных магистралей время часто растёт сильнее, чем по «идеальной» карте.",
  "У оживлённой улицы сравните шум на средних и верхних этажах — картина может отличаться.",
  "Оцените пешую доступность к остановкам и парковку двора: маркетинговая схема не заменяет визит.",
  "Если адрес привязан к новой улице, уточните фактический подъезд и зимнюю уборку.",
];

const BISHKEK_LOCAL = [
  "Загляните во двор вечером: освещение, парковка, поток машин у подъезда.",
  "Спросите у жильцов соседних домов про воду, отопление и типичный шум — это быстрый sanity-check.",
  "Сверьте подпись района в каталоге с тем, что видите на карте и на месте.",
];

const OSH_AIR = [
  "В Оше в сухие периоды пыль и жара ощущаются сильнее у дорог — учтите при выборе этажа и ориентации.",
  "Проверьте продуваемость и тень: в жару это сильнее влияет на комфорт, чем на бумаге.",
  "Спросите про сезонные ветра и пыль в конкретном квартале — микроклимат может отличаться от соседнего.",
];

const OSH_TRANSPORT = [
  "Оцените реальную доступность транспорта до работы, школы и центра в вашем расписании.",
  "Шум лучше слушать в будний день утром и после работы — пиковая нагрузка на улицу виднее.",
  "Уточните подъезд и парковку: на окраинах это часто решает удобство сильнее, чем «красота» фасада.",
];

const OSH_LOCAL = [
  "Сверьте инфраструктуру рядом с домом на месте, не только по презентации застройщика.",
  "Сделайте второй визит в другое время суток — нагрузка на район и шум меняются.",
];

const GENERIC_AIR = [
  "Микроклимат в соседних кварталах может отличаться: ветер, пыль и влажность лучше оценить на месте.",
  "Если город в данных не стандартный, соберите локальные заметки у жильцов и в чатах района.",
];

const GENERIC_TRANSPORT = [
  "Проверьте подъездные пути зимой и после дождя, особенно на окраине или в пригороде.",
  "Сопоставьте карту и фактический маршрут до ключевых точек в будни.",
];

const GENERIC_LOCAL = [
  "Посетите локацию 2–3 раза в разное время суток — так виднее реальная нагрузка на район.",
  "Сверьте адрес каталога с пином и границами участка до брони.",
];

function locationOpinionForRow(row) {
  const key = row.projectId;
  const city = cityLabel(row);
  const hasCoords = row.lat != null && row.lng != null;
  const hasPassport = isPresent(row.passportUrl);
  const hasDualPrice = isPresent(row.priceUsdM2) && isPresent(row.priceKgsM2);
  const sd = row.subdistrictNames;
  const sdSuffix =
    sd.length > 0 ? ` В каталоге для района указано: ${sd.slice(0, 4).join(", ")}.` : "";

  const airAndClimate = [];
  const transportAndNoise = [];
  const localChecks = [];

  if (row.cityId === 1) {
    airAndClimate.push(...pickMany(key, "bk-air", BISHKEK_AIR, 2));
    transportAndNoise.push(...pickMany(key, "bk-tr", BISHKEK_TRANSPORT, 2));
    localChecks.push(...pickMany(key, "bk-lc", BISHKEK_LOCAL, 2));
  } else if (row.cityId === 2) {
    airAndClimate.push(...pickMany(key, "osh-air", OSH_AIR, 2));
    transportAndNoise.push(...pickMany(key, "osh-tr", OSH_TRANSPORT, 2));
    localChecks.push(...pickMany(key, "osh-lc", OSH_LOCAL, 2));
  } else {
    airAndClimate.push(...pickMany(key, "gen-air", GENERIC_AIR, 2));
    transportAndNoise.push(...pickMany(key, "gen-tr", GENERIC_TRANSPORT, 2));
    localChecks.push(...pickMany(key, "gen-lc", GENERIC_LOCAL, 2));
  }

  if (!hasCoords) {
    transportAndNoise.push("Координаты в выгрузке отсутствуют — запросите точный пин и пересчитайте расстояния вручную.");
  } else {
    localChecks.push(
      pick(key, "coords", [
        "По координатам из карты отметьте ближайшие магистрали, стройки, рынки и сервисные зоны как источники шума.",
        "Сверьте пин с подъездом: иногда маркетинговая точка не совпадает с реальным входом во двор.",
      ]),
    );
  }

  if (!hasPassport) {
    localChecks.push("URL паспорта в карточке нет — запросите ссылку на minstroy.gov.kg у застройщика до брони.");
  }
  if (!hasDualPrice) {
    localChecks.push("Цена не дублируется в $/м² и сом/м² — зафиксируйте расчёт в сомах на дату договора.");
  }
  if (row.statusCode === "SUSPENDED") {
    localChecks.push("При статусе приостановки нужны письменные пояснения и сроки возобновления от контрагента.");
  }

  const title = row.title || "объект";
  let summary = pick(key, "loc-sum", [
    `Для «${title}» в ${city} сначала соберите бытовой сценарий: воздух и шум в вашем графике, дорога до работы/школы, двор вечером${sdSuffix}`,
    `По «${title}» (${city}) проверьте микроклимат у дома, связность транспорта и ощущения от района в разное время дня${sdSuffix}`,
    `Локация «${title}» (${city}): опирайтесь на визиты, карту и мнение соседей, не только на текст карточки${sdSuffix}`,
  ]);
  summary = summary.replace(/\s+\./g, ".").trim();
  if (!summary.endsWith(".")) summary += ".";

  return {
    summary,
    airAndClimate: normalizeList(airAndClimate, 4),
    transportAndNoise: normalizeList(transportAndNoise, 4),
    localChecks: normalizeList(localChecks, 4),
  };
}

function localOpinion(row, generatedAt) {
  const key = row.projectId;
  const positives = [];
  const cautions = [];
  const questions = [];
  let score = 50;

  const displayTitle = row.title || "объект без названия в выгрузке";
  const builderBit = row.builderName ? ` Застройщик в данных: «${row.builderName}».` : "";
  const addressBit = row.address ? ` Адрес в каталоге: ${row.address}.` : " Адрес в каталоге не заполнен.";

  if (isPresent(row.passportUrl)) {
    positives.push(
      pick(key, "pass+", [
        `У «${displayTitle}» в карточке есть ссылка на паспорт — удобная отправная точка для сверки с реестром.`,
        "В выгрузке указан URL паспорта объекта; сравните его с актуальной записью на minstroy.gov.kg.",
        "Паспорт в открытых полях присутствует: сохраните скриншот и дату проверки.",
      ]),
    );
    score += 12;
  } else {
    cautions.push(`Для «${displayTitle}» в данных нет ссылки на паспорт объекта.`);
    questions.push("Попросите у застройщика точный URL паспорта на minstroy.gov.kg и проверьте статус.");
    score -= 12;
  }

  if (isPresent(row.priceUsdM2) && isPresent(row.priceKgsM2)) {
    positives.push(
      pick(key, "price+", [
        "В карточке указаны ориентиры и в $/м², и в сом/м² — проще сравнивать с другими объектами.",
        "Двойная ценовая разметка ($ и сом) снижает риск разночтений при переговорах.",
      ]),
    );
    questions.push(
      pick(key, "price-q", [
        "Уточните в договоре курс и дату фиксации цены в сомах.",
        "Спросите, включены ли отделка, паркинг и кладовые в указанную цену за м².",
      ]),
    );
    score += 8;
  } else if (isPresent(row.priceUsdM2) || isPresent(row.priceKgsM2)) {
    cautions.push("Цена указана только в одной валюте/формате — возможны разночтения при оплате.");
    score -= 2;
  } else {
    cautions.push(`По «${displayTitle}» в выгрузке нет явного ориентира цены за м².`);
    score -= 8;
  }

  if (isPresent(row.finish)) {
    const finishLabel = formatFinishRu(row.finish) ?? row.finish;
    positives.push(`В данных указан ориентир срока: ${finishLabel}.`);
    score += 5;
  } else {
    cautions.push("Плановый срок завершения в выгрузке не заполнен.");
    score -= 5;
  }

  if (row.statusCode === "SUSPENDED") {
    cautions.push(`Статус «${displayTitle}» в данных: приостановка — нужна отдельная юридическая и фактическая проверка.`);
    questions.push("Какое основание приостановки и какие сроки возобновления подтверждает застройщик письменно?");
    score -= 14;
  } else if (row.statusCode === "PLANNED") {
    cautions.push("Статус в данных — ранняя стадия; детали и сроки могут сдвигаться.");
    score -= 4;
  } else if (row.statusCode === "IN_PROGRESS") {
    positives.push("В выгрузке объект числится в строительстве — сроки и этапы стоит сверить с паспортом и на площадке.");
    score += 2;
  } else if (row.statusCode === "COMPLETED") {
    positives.push("В данных статус — завершён; остаётся проверить фактическую передачу и документы.");
    questions.push("Спросите про акт приёмки, гарантии и остаточные работы по дому.");
    score += 3;
  }

  if (row.lat == null || row.lng == null) {
    cautions.push("Координаты объекта в выгрузке отсутствуют — картографическая проверка окружения затруднена.");
    questions.push("Запросите точные координаты или пин для проверки шума, дорог и инфраструктуры.");
    score -= 3;
  } else {
    positives.push("Координаты есть — можно заранее изучить окружение на карте и спланировать визит.");
    score += 3;
  }

  if (row.subdistrictNames.length > 0) {
    positives.push(`В данных указаны подписи района: ${row.subdistrictNames.slice(0, 3).join(", ")} — сверьте с картой.`);
    score += 1;
  }

  score = Math.max(0, Math.min(100, score));
  const confidence = score >= 72 ? "high" : score >= 48 ? "medium" : "low";

  const statusLine = statusPhraseRu(row.statusCode);
  const summaryCore = pick(key, "sum", [
    `Объект «${displayTitle}»:${builderBit}${addressBit} ${statusLine}.`,
    `«${displayTitle}»${row.builderName ? ` от «${row.builderName}»` : ""}.${addressBit} ${statusLine}.`,
    `Рассматривая «${displayTitle}», опирайтесь на поля каталога:${builderBit}${addressBit} ${statusLine}.`,
  ]);

  const closing =
    score >= 72
      ? pick(key, "close-hi", [
          " По открытым полям картина довольно цельная, но договор и паспорт проверьте отдельно.",
          " Сигналов достаточно для первичного отбора; финальное решение — после документов и визита.",
        ])
      : score >= 48
        ? pick(key, "close-med", [
            " Есть база для сравнения, но перед бронью закройте пробелы по цене, статусу и паспорту.",
            " Карточка неполная для автоматического «да» — уточните спорные поля у застройщика.",
          ])
        : pick(key, "close-lo", [
            " Мало подтверждающих полей в выгрузке — пройдитесь по паспорту, цене и контрагенту максимально плотно.",
            " Риск непрозрачности выше: соберите документы и независимые проверки до любых предоплат.",
          ]);

  const summary = (summaryCore + closing).replace(/\s+/g, " ").replace(/\s+\./g, ".").trim();

  return {
    summary,
    positives: normalizeList(positives, 4),
    cautions: normalizeList(cautions, 4),
    questions: normalizeList(questions, 4),
    locationOpinion: locationOpinionForRow(row),
    confidence,
    model: "assistant-opinion-v3",
    generatedAt,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const all = loadObjects();
  const existing = loadExisting();
  const queue = args.onlyMissing ? all.filter((r) => !existing[r.projectId]) : all;
  const rows = args.limit ? queue.slice(0, args.limit) : queue;

  console.log(`Objects: ${all.length}. To process: ${rows.length}.`);

  const out = args.onlyMissing ? { ...existing } : {};
  const batchTime = new Date().toISOString();

  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    try {
      const opinion = localOpinion(row, batchTime);
      out[row.projectId] = opinion;
      if ((i + 1) % 10 === 0 || i === rows.length - 1) {
        writeFileSync(outPath, `${JSON.stringify(out, null, 2)}\n`, "utf8");
      }
      console.log(`[${i + 1}/${rows.length}] ${row.projectId} OK`);
    } catch (err) {
      console.error(`[${i + 1}/${rows.length}] ${row.projectId} FAILED: ${String(err)}`);
    }
  }

  if (!args.onlyMissing && !args.limit) {
    const outIds = new Set(Object.keys(out));
    const missing = all.filter((r) => !outIds.has(r.projectId));
    if (missing.length) {
      console.error(`Warning: ${missing.length} objects missing from output after run.`);
    } else {
      console.log(`Verified: ${outIds.size} opinion keys match object count.`);
    }
  }

  writeFileSync(outPath, `${JSON.stringify(out, null, 2)}\n`, "utf8");
  console.log(`Done. Wrote ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
