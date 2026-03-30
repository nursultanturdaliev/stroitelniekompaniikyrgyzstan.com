import type {
  CompanyType,
  ConstructionCompany,
  CompletedProject,
  PriceRangeTier,
  ServiceCategory,
} from "@/types/company";
import {
  elitkaConstructionStatusLabel,
  formatIsoDateRu,
  plannedMonthsBetween,
  scheduleSlipNoteRu,
} from "@/lib/elitkaSchedule";
import { buildElitkaObjectFactsFromDetail } from "@/lib/elitkaObjectFacts";
import { elitkaObjectImageUrls } from "@/lib/elitkaMedia";
import { inferCityFromAddress } from "@/lib/geoKg";
import { passportEntryForUrl } from "@/lib/minstroyPassportSnapshot";
import { websiteSnapshotForCompanyId } from "@/lib/companyWebsiteSnapshot";
import mergedRaw from "../../scraped/merged-companies.json";

type ElitkaObjectDetail = Record<string, unknown>;

type ElitkaObject = {
  id?: number;
  title: string;
  slug: string;
  address: string;
  price_usd_m2: string;
  price_kgs_m2: string;
  gosstroy_registry: string | null;
  finish: string | null;
  main_img?: string | null;
  rating?: number | null;
  reviews_count?: number | null;
  detail?: ElitkaObjectDetail;
};

type ElitkaBuilderDetail = {
  email?: string;
  phone2?: string;
  phone3?: string;
  office_address?: string;
  founded_year?: string;
  instagram?: string;
  site_url?: string;
  inn?: string;
  legal_name_osoo?: string;
  photo_file?: string;
  subscription_plan?: string;
  description_text?: string;
};

type ElitkaBuilder = {
  source: string;
  builderId: number;
  name: string;
  slug: string;
  phone: string;
  whatsapp: string;
  objects: ElitkaObject[];
  builder_detail?: ElitkaBuilderDetail;
};

type HouseKgCompany = {
  source: string;
  slug: string;
  name: string;
  url: string;
  phones: string[];
  phone: string;
  website: string | null;
  email: string | null;
  description: string | null;
  logo_url?: string | null;
  banner_url?: string | null;
  verified_realtor_assoc?: boolean;
  rating?: number | null;
  review_count?: number | null;
  physical_address?: string | null;
  work_hours_text?: string | null;
  listing_tab_labels?: string[] | null;
  filter_listing_count?: number | null;
  social?: Record<string, string> | null;
  product_tier?: string | null;
};

type MinstroyLicenseRow = {
  source: string;
  registry_level: number;
  registry_level_label: string;
  registry_list_url: string;
  registry_page: number;
  row_index?: string;
  series?: string;
  license_number?: string;
  issue_date?: string;
  company_name?: string;
  director_name?: string;
  address?: string;
  inn?: string;
  commission_decision?: string;
  license_valid_until?: string;
  foreign_license_country?: string;
  registry_entry_date?: string;
  activity_type?: string;
  registry_type?: string;
  violating_authority?: string;
  appeal_available?: string;
};

type MergedFile = {
  scrapedAt: string;
  sources: {
    elitka: { builders: ElitkaBuilder[] };
    house_kg: { companies: HouseKgCompany[] };
    minstroy?: {
      official_registry_url: string;
      note_ru: string;
      licenses: MinstroyLicenseRow[];
      /** Компактные записи без поля source (как в выгрузке скрипта). */
      by_inn: Record<string, Array<Partial<MinstroyLicenseRow> & { registry_level: number }>>;
      passport_pages?: {
        scrapedAt?: string;
        note_ru?: string;
        by_url?: Record<
          string,
          {
            http_status: number | null;
            error: string | null;
            fields: Record<string, string>;
            fetched_at?: string;
          }
        >;
      };
    };
    company_website_snapshots?: {
      scrapedAt?: string;
      note_ru?: string;
      by_company_id?: Record<
        string,
        {
          requested_url?: string;
          final_url?: string;
          fetched_at?: string;
          http_status?: number | null;
          error?: string | null;
          fields?: Record<string, string>;
          same_as?: string[];
          extra_pages_fetched?: string[];
        }
      >;
    };
    project_cross_listings?: {
      note_ru?: string;
      by_elitka_object_id?: Record<string, unknown>;
    };
  };
};

const merged = mergedRaw as unknown as MergedFile;

const MINSTROY_OFFICIAL =
  merged.sources.minstroy?.official_registry_url ?? "https://minstroy.gov.kg/ru/license/reestr";

function pickWebsiteSnapshotForUi(companyId: string) {
  const ws = websiteSnapshotForCompanyId(companyId);
  if (!ws) return undefined;
  const n = Object.keys(ws.fields ?? {}).length;
  if (n > 0 || ws.parseError) return ws;
  if (ws.httpStatus != null && ws.httpStatus !== 200) return ws;
  return undefined;
}

function normalizeCompanyKey(raw: string): string {
  let s = raw.toLowerCase().normalize("NFKC");
  s = s.replace(/&quot;|&laquo;|&raquo;/g, " ");
  s = s.replace(/["«»„“']/g, " ");
  s = s.replace(/\b(осоо|ооо|ooo|тоо|ип|ао|зао|чп|кх|к\s*о\s*о)\b/gi, " ");
  s = s.replace(/\s+/g, " ").trim();
  return s;
}

/** Варианты строки для сопоставления с реестром (название из каталога). */
function companyNameLookupKeys(name: string): string[] {
  const keys = new Set<string>();
  const add = (t: string) => {
    const k = normalizeCompanyKey(t);
    if (k.length >= 4) keys.add(k);
  };
  add(name);
  const paren = name.match(/\(([^)]+)\)/);
  if (paren?.[1]) add(paren[1]);
  for (const m of name.matchAll(/"([^"]+)"|«([^»]+)»/g)) {
    add(m[1] || m[2] || "");
  }
  const parts = name.split(/[/|]/);
  if (parts.length > 1) parts.forEach((p) => add(p));
  return [...keys];
}

function rowSignature(r: MinstroyLicenseRow): string {
  return `${r.registry_level}|${r.inn ?? ""}|${r.license_number ?? ""}|${r.issue_date ?? ""}|${r.company_name ?? ""}`;
}

function minstroyRowsFromInn(inn: string | undefined | null): MinstroyLicenseRow[] {
  const raw = (inn || "").replace(/\D/g, "");
  if (raw.length < 10) return [];
  const rows = merged.sources.minstroy?.by_inn?.[raw] ?? merged.sources.minstroy?.by_inn?.[(inn || "").trim()];
  if (!Array.isArray(rows)) return [];
  return rows.map((r) => ({ ...r, source: "minstroy.gov.kg" }) as MinstroyLicenseRow);
}

function mergeMinstroyRowLists(...lists: MinstroyLicenseRow[][]): MinstroyLicenseRow[] {
  const seen = new Set<string>();
  const out: MinstroyLicenseRow[] = [];
  for (const list of lists) {
    for (const r of list) {
      const k = rowSignature(r);
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(r);
    }
  }
  return out;
}

function buildMinstroyNameIndex(rows: MinstroyLicenseRow[]): Map<string, MinstroyLicenseRow[]> {
  const map = new Map<string, MinstroyLicenseRow[]>();
  for (const row of rows) {
    const cn = row.company_name;
    if (!cn) continue;
    const key = normalizeCompanyKey(cn);
    if (key.length < 4) continue;
    const list = map.get(key) ?? [];
    list.push(row);
    map.set(key, list);
  }
  return map;
}

/** Сопоставление названия компании со строками реестра Минстроя (точное и по подстроке). */
function findMinstroyRowsForName(name: string, index: Map<string, MinstroyLicenseRow[]>): MinstroyLicenseRow[] {
  const tryKeys = companyNameLookupKeys(name);
  const seen = new Set<string>();
  const out: MinstroyLicenseRow[] = [];
  const pushAll = (rows: MinstroyLicenseRow[] | undefined) => {
    if (!rows) return;
    for (const r of rows) {
      const sig = rowSignature(r);
      if (seen.has(sig)) continue;
      seen.add(sig);
      out.push(r);
    }
  };
  for (const k of tryKeys) {
    pushAll(index.get(k));
  }
  const SUBSTR_MIN = 10;
  for (const k of tryKeys) {
    if (k.length < SUBSTR_MIN) continue;
    for (const [ik, rows] of index) {
      if (ik === k) continue;
      if (ik.includes(k) || k.includes(ik)) pushAll(rows);
    }
  }
  return out;
}

function formatMinstroyRowBrief(r: MinstroyLicenseRow): string {
  if (r.registry_level === 5) {
    const bits = [r.company_name, r.inn ? `ИНН ${r.inn}` : null, r.foreign_license_country, r.registry_entry_date].filter(Boolean);
    return `Иностранный реестр: ${bits.join(", ")}`;
  }
  if (r.registry_level === 6) {
    return [r.company_name, r.issue_date, r.commission_decision].filter(Boolean).join(" — ");
  }
  const num = [r.series, r.license_number].filter(Boolean).join(" №");
  const bits = [num || null, r.issue_date ? `от ${r.issue_date}` : null, r.inn ? `ИНН ${r.inn}` : null].filter(Boolean);
  return `${r.registry_level_label}: ${bits.join(", ")}`;
}

function minstroyNotesForMatches(rows: MinstroyLicenseRow[]): {
  hasPositiveRegistry: boolean;
  hasBlacklist: boolean;
  lines: string[];
} {
  const blacklist = rows.filter((r) => r.registry_level === 6);
  const positive = rows.filter((r) => r.registry_level >= 1 && r.registry_level <= 5);
  const lines: string[] = [];
  if (positive.length) {
    lines.push("Реестр лицензий Минстроя КР (по совпадению названия):");
    positive.slice(0, 5).forEach((r) => lines.push(`• ${formatMinstroyRowBrief(r)}`));
    if (positive.length > 5) lines.push(`… всего совпадений: ${positive.length}`);
    lines.push(`Проверить официально: ${MINSTROY_OFFICIAL}`);
  }
  if (blacklist.length) {
    lines.push("Внимание: в открытом «Чёрном списке» реестра Минстроя есть записи с похожим наименованием — уточняйте статус на сайте ведомства.");
    blacklist.slice(0, 3).forEach((r) => lines.push(`• ${formatMinstroyRowBrief(r)}`));
  }
  return {
    hasPositiveRegistry: positive.length > 0,
    hasBlacklist: blacklist.length > 0,
    lines,
  };
}

const minstroyRows: MinstroyLicenseRow[] = merged.sources.minstroy?.licenses ?? [];
const minstroyNameIndex = minstroyRows.length ? buildMinstroyNameIndex(minstroyRows) : new Map<string, MinstroyLicenseRow[]>();

function parseUsd(s: string): number | null {
  const n = Number.parseFloat(String(s).replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function priceTierFromUsd(values: number[]): PriceRangeTier {
  if (values.length === 0) return "mid";
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  if (avg < 1000) return "budget";
  if (avg < 1500) return "mid";
  if (avg < 2000) return "premium";
  return "luxury";
}

function projectTypeFromTitle(title: string): ServiceCategory {
  const t = title.toLowerCase();
  if (t.includes("жк") || t.includes("комплекс")) return "Многоэтажное строительство";
  return "Строительство домов";
}

function elitkaObjectToProject(o: ElitkaObject): CompletedProject {
  const y = o.finish ? new Date(o.finish).getFullYear() : undefined;
  const d = o.detail;
  const dRecord = d && typeof d === "object" ? (d as Record<string, unknown>) : undefined;
  const startIso =
    typeof d?.construction_start_date === "string" ? d.construction_start_date : undefined;
  const finishIso =
    typeof d?.construction_finish_date === "string"
      ? d.construction_finish_date
      : o.finish && String(o.finish).length > 4
        ? String(o.finish)
        : undefined;
  const initialFinishIso =
    typeof d?.initial_construction_finish_date === "string" ? d.initial_construction_finish_date : undefined;
  const regUrl =
    (d?.gosstroy_registry && String(d.gosstroy_registry).startsWith("http") ? String(d.gosstroy_registry) : null) ||
    (o.gosstroy_registry && String(o.gosstroy_registry).startsWith("http") ? String(o.gosstroy_registry) : null);
  const statusRaw = typeof d?.status === "string" ? d.status : undefined;
  const descLines = [o.address.trim()];
  if (d?.object_class) descLines.push(`Класс ЖК: ${String(d.object_class)}`);
  if (d?.total_flats != null) descLines.push(`Квартир: ${String(d.total_flats)}`);
  if (d?.floor_count) descLines.push(`Этажность: ${String(d.floor_count)}`);
  if (d?.description_text && String(d.description_text).length > 20) {
    descLines.push(String(d.description_text).slice(0, 400) + (String(d.description_text).length > 400 ? "…" : ""));
  }
  const desc = descLines.filter(Boolean).join("\n");
  const usd = parseUsd(o.price_usd_m2);
  const kgs = parseUsd(o.price_kgs_m2);
  const priceBits = [
    usd ? `от $${Math.round(usd)}/м²` : null,
    kgs ? `от ${Math.round(kgs).toLocaleString("ru-RU")} сом/м²` : null,
  ].filter(Boolean);
  const oid = typeof o.id === "number" ? o.id : undefined;
  const passportSnap = regUrl ? passportEntryForUrl(regUrl) : undefined;
  const hasPassportSnap =
    passportSnap &&
    (Object.keys(passportSnap.fields || {}).length > 0 || passportSnap.error);
  const passportSnapshot = hasPassportSnap
    ? {
        fetchedAt: passportSnap!.fetched_at,
        httpStatus: passportSnap!.http_status,
        parseError: passportSnap!.error ?? undefined,
        fields: passportSnap!.fields || {},
      }
    : undefined;
  const elitkaFacts = buildElitkaObjectFactsFromDetail(dRecord, o.slug);
  const mainForGallery =
    (typeof dRecord?.main_img === "string" ? dRecord.main_img : null) || o.main_img || null;
  const galleryImages =
    oid != null ? elitkaObjectImageUrls(oid, mainForGallery, dRecord?.images ?? null) : [];
  const listUsdRaw = typeof o.price_usd_m2 === "string" ? o.price_usd_m2.trim() : "";
  const listKgsRaw = typeof o.price_kgs_m2 === "string" ? o.price_kgs_m2.trim() : "";
  return {
    title: o.title,
    description: desc || "Объект из каталога elitka.kg",
    images: galleryImages,
    area: priceBits.length ? priceBits.join(" · ") : undefined,
    type: projectTypeFromTitle(o.title),
    year: y && y > 1990 ? y : undefined,
    key: oid != null ? `elitka-${oid}` : `${o.slug}-${o.title}`.slice(0, 80),
    elitkaObjectId: oid,
    elitkaStatusLabel: elitkaConstructionStatusLabel(statusRaw),
    elitkaConstructionStatusCode: statusRaw,
    plannedStartDisplay: formatIsoDateRu(startIso),
    plannedFinishDisplay: formatIsoDateRu(finishIso),
    initialPlannedFinishDisplay:
      initialFinishIso && finishIso && initialFinishIso !== finishIso
        ? formatIsoDateRu(initialFinishIso)
        : undefined,
    plannedDurationMonths: plannedMonthsBetween(startIso, finishIso),
    scheduleSlipNote: scheduleSlipNoteRu(initialFinishIso, finishIso),
    passportUrl: regUrl ?? undefined,
    passportSnapshot,
    elitkaFacts,
    listPriceUsdM2: listUsdRaw && listUsdRaw !== "0" ? listUsdRaw : undefined,
    listPriceKgsM2: listKgsRaw && listKgsRaw !== "0" ? listKgsRaw : undefined,
  };
}

function formatWhatsapp(raw: string): string | undefined {
  const d = raw.replace(/\D/g, "");
  if (d.length < 9) return undefined;
  return d.startsWith("996") ? `+${d}` : `+996${d}`;
}

/** Текст для эвристик: название, описание, вкладки объявлений. */
function houseKgBlob(c: HouseKgCompany): string {
  return [c.name, c.description, c.product_tier, ...(c.listing_tab_labels || [])]
    .filter(Boolean)
    .join("\n")
    .toLowerCase()
    .normalize("NFC");
}

type HouseKgKind = "agency" | "construction" | "mixed";

/**
 * Классификация профиля house.kg: риелторы vs строители по описанию и меткам.
 * Каталог «Компании» на house.kg в основном посредники — при слабых сигналах склоняем к агентству.
 */
function classifyHouseKgCompany(c: HouseKgCompany): HouseKgKind {
  const blob = houseKgBlob(c);
  let agency = 0;
  let construction = 0;

  if (c.verified_realtor_assoc) agency += 5;
  if (c.product_tier && /эксперт/i.test(c.product_tier) && construction < 3) agency += 2;

  const agencyHits: [RegExp, number][] = [
    [/риелт|риэлтор|риэлт/i, 3],
    [/агентств[оа]\s+недвижимост/i, 4],
    [/агентств[оа]\s+по\s+недвижимост/i, 4],
    [/посреднич/i, 2],
    [/купля[-\s]?продажа/i, 2],
    [/аренда[^\n]{0,48}(квартир|жиль|дом|недвижимост)/i, 2],
    [/продажа[^\n]{0,48}(квартир|домов|участк|недвижимост)/i, 2],
    [/эксперты?\s+по\s+недвижимост/i, 3],
    [/юридическ[оео\s]+сопровожден/i, 1.5],
    [/оформлени[ея]\s+сделок?/i, 1.5],
    [/коммерческ(?:ая|ой|ую)\s+недвижимост/i, 1],
    [/вторичн/i, 1.5],
    [/подбор\s+объект/i, 1.5],
  ];
  const buildHits: [RegExp, number][] = [
    [/застройщик/i, 4],
    [/генподряд|ген\s*подряд/i, 4],
    [/строительн(?:ая|ой|ые|ую)\s+компан/i, 4],
    [/строительн(?:ые|ых)\s+работ/i, 3],
    [/\bсмр\b|подрядчик/i, 2.5],
    [/монолит|котлован|бетонн|кирпичн(?:ая|ую)\s+кладк/i, 2],
    [/ремонт\s+под\s+ключ|отделк[аи]\s+(квартир|помещ)/i, 2],
    [/проектирова|проектн(?:ая|о)\s+организ/i, 2],
    [/фундамент|кровел|фасадн/i, 2],
    [/благоустройств|инженерн(?:ые|ых)\s+сет/i, 1.5],
  ];

  for (const [re, w] of agencyHits) {
    if (re.test(blob)) agency += w;
  }
  for (const [re, w] of buildHits) {
    if (re.test(blob)) construction += w;
  }

  const tabs = (c.listing_tab_labels || []).join(" ");
  if (/продажа/i.test(tabs) && /аренда/i.test(tabs) && construction < 2) agency += 1.5;

  if (construction >= 4 && construction > agency + 1) return "construction";
  if (agency >= 4 && agency > construction + 1) return "agency";
  if (agency >= 3 && construction >= 3) return "mixed";
  if (agency >= construction) return "agency";
  return "construction";
}

function houseKgProfileForKind(kind: HouseKgKind): {
  type: CompanyType[];
  services: string[];
  specializations: ServiceCategory[];
  defaultTagline: string;
  categoryNote: string;
} {
  if (kind === "construction") {
    return {
      type: ["Строительная компания", "Застройщик"],
      services: ["Строительство и отделка", "Подрядные работы", "Консультации — уточняйте на house.kg"],
      specializations: ["Многоэтажное строительство", "Строительство домов"],
      defaultTagline: "Компания в каталоге house.kg — уточните услуги на странице профиля.",
      categoryNote:
        "Тип в каталоге: строительный / подрядный профиль (по ключевым словам в описании house.kg). Если это ошибка, ориентируйтесь на сайт компании.",
    };
  }
  if (kind === "mixed") {
    return {
      type: ["Агентство недвижимости", "Строительная компания"],
      services: ["Недвижимость", "Сделки", "Возможны строительные услуги — уточняйте у компании"],
      specializations: ["Риелторские услуги", "Строительство домов"],
      defaultTagline: "Компания на house.kg: по тексту сочетаются посреднические и строительные услуги.",
      categoryNote:
        "Тип в каталоге: смешанный (и риелторские, и строительные формулировки). Уточняйте у компании основной вид деятельности.",
    };
  }
  return {
    type: ["Агентство недвижимости"],
    services: [
      "Продажа жилой и коммерческой недвижимости",
      "Аренда",
      "Подбор объектов",
      "Сопровождение сделок",
    ],
    specializations: ["Риелторские услуги", "Аренда жилья", "Продажа вторичного жилья"],
    defaultTagline: "Агентство недвижимости / риелторский профиль (по описанию на house.kg).",
    categoryNote:
      "Тип в каталоге: агентство недвижимости / риелтор (по тексту профиля и меткам house.kg). Не путать с застройщиком — проверяйте лицензии и договор.",
  };
}

/** Редкий случай: в elitka попала карточка без типичных объектов застройщика. */
function elitkaLooksLikeAgencyOnly(b: ElitkaBuilder): boolean {
  const titles = b.objects.map((o) => o.title).join(" ");
  if (/жк|жилой\s+комплекс|новостро|коттедж|жилой\s+дом/i.test(titles)) return false;
  const blob = [b.name, b.builder_detail?.description_text].filter(Boolean).join("\n").toLowerCase();
  if (!blob.trim()) return false;
  return (
    /риелт|риэлтор|агентств[оа]\s+недвижимост|посреднич/i.test(blob) &&
    !/строитель|застройщик|смр|подряд/i.test(blob)
  );
}

function elitkaToCompany(b: ElitkaBuilder): ConstructionCompany {
  const usdPrices = b.objects.map((o) => parseUsd(o.price_usd_m2)).filter((n): n is number => n !== null);
  const tier = priceTierFromUsd(usdPrices);
  const minU = usdPrices.length ? Math.min(...usdPrices) : null;
  const maxU = usdPrices.length ? Math.max(...usdPrices) : null;
  const priceNote =
    minU && maxU && minU !== maxU
      ? `Ориентир по каталогу: $${Math.round(minU)}–${Math.round(maxU)}/м²`
      : minU
        ? `Ориентир по каталогу: от $${Math.round(minU)}/м²`
        : "Цену уточняйте у застройщика";

  const hasRegistry = b.objects.some((o) => {
    const fromDetail = o.detail?.gosstroy_registry;
    const u = fromDetail || o.gosstroy_registry;
    return u != null && String(u).startsWith("http");
  });
  const bd = b.builder_detail;
  const minRows = mergeMinstroyRowLists(
    findMinstroyRowsForName(b.name, minstroyNameIndex),
    minstroyRowsFromInn(bd?.inn),
  );
  const minNotes = minRows.length ? minstroyNotesForMatches(minRows) : null;
  const hasMinstroyPositive = Boolean(minNotes?.hasPositiveRegistry);
  /** Лицензия: паспорт объекта и/или строка реестра; не ставим «да», если только чёрный список. */
  const showLicensed =
    (hasRegistry || hasMinstroyPositive) &&
    !(minNotes?.hasBlacklist && !hasRegistry && !hasMinstroyPositive);
  const primaryCity =
    b.objects.map((o) => inferCityFromAddress(o.address)).find((c) => c) ?? "Бишкек";

  const scrapedDate = merged.scrapedAt ? new Date(merged.scrapedAt).toLocaleDateString("ru-RU") : "";

  const licenseParts: string[] = [];
  if (hasRegistry) licenseParts.push("Есть ссылки на карточки гос. реестра по объектам (паспорт объекта на minstroy.gov.kg).");
  if (bd?.inn) licenseParts.push(`ИНН из профиля elitka.kg: ${bd.inn} (сверьте с реестром Минстроя).`);
  if (minNotes?.lines.length) licenseParts.push(minNotes.lines.join("\n"));
  const licenseInfo = licenseParts.length > 0 ? licenseParts.join("\n\n") : undefined;

  const sources = new Set<string>([b.source]);
  if (minRows.length) sources.add("minstroy.gov.kg");

  const foundedYear = bd?.founded_year ? Number.parseInt(String(bd.founded_year), 10) : undefined;
  const fy = foundedYear && foundedYear > 1980 && foundedYear <= new Date().getFullYear() ? foundedYear : undefined;
  const experienceYears = fy ? Math.max(0, new Date().getFullYear() - fy) : 0;

  const withCoords = b.objects.find((o) => {
    const lat = o.detail?.lat;
    const lon = o.detail?.lon;
    return typeof lat === "number" && typeof lon === "number";
  });
  const lat =
    typeof withCoords?.detail?.lat === "number" ? (withCoords.detail.lat as number) : 42.8746;
  const lng =
    typeof withCoords?.detail?.lon === "number" ? (withCoords.detail.lon as number) : 74.5698;

  const agencyOnlyElitka = elitkaLooksLikeAgencyOnly(b);
  const elitkaTypes: CompanyType[] = agencyOnlyElitka
    ? ["Агентство недвижимости"]
    : ["Застройщик", "Строительная компания"];
  const elitkaServices = agencyOnlyElitka
    ? [
        "Услуги на рынке недвижимости (по тексту профиля elitka)",
        "Уточняйте, застройщик это или агентство",
      ]
    : ["Новостройки", "Жилые комплексы", "Продажа квартир от застройщика"];
  const elitkaSpecs: ServiceCategory[] = agencyOnlyElitka
    ? ["Риелторские услуги", "Продажа вторичного жилья"]
    : ["Многоэтажное строительство", "Строительство домов"];

  const descHead: string[] = [
    `Карточка собрана из открытых данных elitka.kg${scrapedDate ? ` (${scrapedDate})` : ""}.`,
  ];
  if (agencyOnlyElitka) {
    descHead.push(
      "Тип в каталоге: по описанию похоже на агентство недвижимости, а не на застройщика — перепроверьте на сайте компании.",
    );
  }
  if (bd?.legal_name_osoo) descHead.push(`Юр. наименование (по elitka): ${bd.legal_name_osoo}.`);
  if (bd?.office_address) descHead.push(`Офис (по elitka): ${bd.office_address}.`);
  if (bd?.description_text) descHead.push(bd.description_text);

  const elitkaCompanyId = `elitka-${b.builderId}-${b.slug}`;
  const websiteSnap = pickWebsiteSnapshotForUi(elitkaCompanyId);
  if (websiteSnap) sources.add("Сайт компании (снимок HTML)");

  return {
    id: elitkaCompanyId,
    slug: b.slug,
    name: b.name,
    type: elitkaTypes,
    tagline: agencyOnlyElitka
      ? bd?.description_text?.trim().slice(0, 180) || "Профиль в каталоге elitka.kg"
      : b.objects.length === 1
        ? b.objects[0].title
        : `${b.objects.length} объектов в каталоге новостроек (elitka.kg)`,
    description: [
      ...descHead,
      "",
      "Объекты в базе:",
      ...b.objects.slice(0, 12).map((o) => `• ${o.title}${o.address ? ` — ${o.address.trim()}` : ""}`),
      b.objects.length > 12 ? `… и ещё ${b.objects.length - 12}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
    services: elitkaServices,
    specializations: elitkaSpecs,
    priceRange: tier,
    priceNote,
    priceDetails: b.objects.slice(0, 6).map((o) => {
      const u = parseUsd(o.price_usd_m2);
      return {
        service: o.title,
        price: u ? `от $${Math.round(u)}/м²` : "цена по запросу",
      };
    }),
    experience: experienceYears,
    foundedYear: fy,
    projectCount: b.objects.length,
    completedProjects: b.objects.slice(0, 36).map(elitkaObjectToProject),
    contacts: {
      phone: b.phone || bd?.phone2 || bd?.phone3 || undefined,
      whatsapp: formatWhatsapp(b.whatsapp),
      email: bd?.email || undefined,
      website: bd?.site_url || undefined,
      instagram: bd?.instagram || undefined,
    },
    location: {
      city: primaryCity,
      address: bd?.office_address || b.objects[0]?.address?.trim(),
      lat,
      lng,
    },
    workArea: ["Кыргызстан", primaryCity],
    hasLicense: showLicensed,
    licenseInfo,
    highlights: [
      `${b.objects.length} объект(ов)`,
      "elitka.kg",
      ...(bd?.inn ? [`ИНН ${bd.inn}`] : []),
    ],
    sourceVerified: [...sources],
    minstroyBlacklistWarning: Boolean(minNotes?.hasBlacklist),
    minstroyRegistryMatchCount: minRows.length,
    websiteSnapshot: websiteSnap,
  };
}

function houseKgToCompany(c: HouseKgCompany): ConstructionCompany {
  const scrapedDate = merged.scrapedAt ? new Date(merged.scrapedAt).toLocaleDateString("ru-RU") : "";
  const minRows = findMinstroyRowsForName(c.name, minstroyNameIndex);
  const minNotes = minRows.length ? minstroyNotesForMatches(minRows) : null;
  const hasMinstroyPositive = Boolean(minNotes?.hasPositiveRegistry);
  const showLicensed = hasMinstroyPositive && !(minNotes?.hasBlacklist && !hasMinstroyPositive);
  const licenseInfo =
    minNotes?.lines.length && (hasMinstroyPositive || minNotes.hasBlacklist) ? minNotes.lines.join("\n") : undefined;
  const sources = new Set<string>([c.source]);
  if (minRows.length) sources.add("minstroy.gov.kg");

  const ig = c.social?.instagram;

  const kind = classifyHouseKgCompany(c);
  const profile = houseKgProfileForKind(kind);

  const highlights: string[] = ["house.kg"];
  if (c.verified_realtor_assoc) highlights.push("Подтверждение House.kg / ассоциация риелторов");
  if (c.product_tier) highlights.push(c.product_tier);
  if (c.filter_listing_count != null) highlights.push(`~${c.filter_listing_count} объявл. в фильтре`);
  highlights.push(profile.type[0]);

  const houseCompanyId = `house-kg-${c.slug}`;
  const websiteSnapHouse = pickWebsiteSnapshotForUi(houseCompanyId);
  if (websiteSnapHouse) sources.add("Сайт компании (снимок HTML)");

  return {
    id: houseCompanyId,
    slug: c.slug,
    name: c.name,
    type: profile.type,
    tagline: c.description?.trim()?.slice(0, 220) || profile.defaultTagline,
    description: [
      profile.categoryNote,
      "",
      `Данные из house.kg${scrapedDate ? ` (выгрузка ${scrapedDate})` : ""}.`,
      c.description?.trim() || "",
      c.physical_address ? `Адрес офиса: ${c.physical_address}` : "",
      c.listing_tab_labels?.length ? `Разделы на профиле: ${c.listing_tab_labels.join(", ")}` : "",
      c.url ? `Страница: ${c.url}` : "",
    ]
      .filter(Boolean)
      .join("\n\n"),
    services: profile.services,
    specializations: profile.specializations,
    priceRange: "mid",
    priceNote: "Уточняйте цены на house.kg или у компании",
    experience: 0,
    rating: c.rating ?? undefined,
    reviewCount: c.review_count ?? undefined,
    contacts: {
      phone: c.phone || c.phones[0],
      email: c.email || undefined,
      website: c.website || c.url || undefined,
      instagram: ig,
    },
    location: {
      city: "Бишкек",
      address: c.physical_address || undefined,
      lat: 42.8746,
      lng: 74.5698,
    },
    workArea: ["Кыргызстан"],
    workHours: c.work_hours_text || undefined,
    hasLicense: showLicensed,
    licenseInfo,
    logo: c.logo_url || undefined,
    coverImage: c.banner_url || undefined,
    highlights,
    sourceVerified: [...sources],
    minstroyBlacklistWarning: Boolean(minNotes?.hasBlacklist),
    minstroyRegistryMatchCount: minRows.length,
    websiteSnapshot: websiteSnapHouse,
  };
}

const elitkaCompanies = merged.sources.elitka.builders.map(elitkaToCompany);
const houseKgCompanies = merged.sources.house_kg.companies.map(houseKgToCompany);

/** Все компании из `scraped/merged-companies.json` (elitka + house.kg + сопоставление с реестром Минстроя). */
export const scrapedMergedCompanies: ConstructionCompany[] = [...elitkaCompanies, ...houseKgCompanies];

/** Сводка по выгрузке реестра лицензий (для подписей «источник» / about). */
export const minstroyRegistrySummary = {
  officialUrl: MINSTROY_OFFICIAL,
  rowCount: minstroyRows.length,
  uniqueInnInIndex: merged.sources.minstroy?.by_inn ? Object.keys(merged.sources.minstroy.by_inn).length : 0,
  scrapedAt: merged.scrapedAt,
};
