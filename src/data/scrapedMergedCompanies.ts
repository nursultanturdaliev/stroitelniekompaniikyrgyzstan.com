import type { ConstructionCompany, CompletedProject, PriceRangeTier, ServiceCategory } from "@/types/company";
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
    };
  };
};

const merged = mergedRaw as unknown as MergedFile;

const MINSTROY_OFFICIAL =
  merged.sources.minstroy?.official_registry_url ?? "https://minstroy.gov.kg/ru/license/reestr";

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

function inferCityFromAddress(address: string): string {
  const a = address.toLowerCase();
  if (a.includes("бишкек") || a.includes("bishkek")) return "Бишкек";
  if (a.includes("ош") && !a.includes("орто")) return "Ош";
  if (a.includes("кант")) return "Кант";
  if (a.includes("токмок")) return "Токмок";
  if (a.includes("каракол")) return "Каракол";
  if (a.includes("орто-сай") || a.includes("орто сай")) return "с. Орто-Сай";
  if (a.includes("беш кунгей") || a.includes("беш-кунгей")) return "с. Беш-Кунгей";
  if (a.includes("кок-джар") || a.includes("кок джар")) return "с. Кок-Джар";
  if (a.includes("джал")) return "Джал";
  return "Бишкек";
}

function projectTypeFromTitle(title: string): ServiceCategory {
  const t = title.toLowerCase();
  if (t.includes("жк") || t.includes("комплекс")) return "Многоэтажное строительство";
  return "Строительство домов";
}

function elitkaObjectToProject(o: ElitkaObject): CompletedProject {
  const y = o.finish ? new Date(o.finish).getFullYear() : undefined;
  const d = o.detail;
  const regUrl =
    (d?.gosstroy_registry && String(d.gosstroy_registry).startsWith("http") ? String(d.gosstroy_registry) : null) ||
    (o.gosstroy_registry && String(o.gosstroy_registry).startsWith("http") ? String(o.gosstroy_registry) : null);
  const descLines = [o.address.trim(), regUrl ? `Реестр: ${regUrl}` : null];
  if (d?.object_class) descLines.push(`Класс ЖК: ${String(d.object_class)}`);
  if (d?.status) descLines.push(`Статус: ${String(d.status)}`);
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
  return {
    title: o.title,
    description: desc || "Объект из каталога elitka.kg",
    images: [],
    area: priceBits.length ? priceBits.join(" · ") : undefined,
    type: projectTypeFromTitle(o.title),
    year: y && y > 1990 ? y : undefined,
  };
}

function formatWhatsapp(raw: string): string | undefined {
  const d = raw.replace(/\D/g, "");
  if (d.length < 9) return undefined;
  return d.startsWith("996") ? `+${d}` : `+996${d}`;
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

  const descHead: string[] = [
    `Карточка собрана из открытых данных elitka.kg${scrapedDate ? ` (${scrapedDate})` : ""}.`,
  ];
  if (bd?.legal_name_osoo) descHead.push(`Юр. наименование (по elitka): ${bd.legal_name_osoo}.`);
  if (bd?.office_address) descHead.push(`Офис (по elitka): ${bd.office_address}.`);
  if (bd?.description_text) descHead.push(bd.description_text);

  return {
    id: `elitka-${b.builderId}-${b.slug}`,
    slug: b.slug,
    name: b.name,
    type: ["Застройщик", "Строительная компания"],
    tagline:
      b.objects.length === 1
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
    services: ["Новостройки", "Жилые комплексы", "Продажа квартир от застройщика"],
    specializations: ["Многоэтажное строительство", "Строительство домов"],
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

  const highlights: string[] = ["house.kg"];
  if (c.verified_realtor_assoc) highlights.push("Подтверждение House.kg / ассоциация риелторов");
  if (c.product_tier) highlights.push(c.product_tier);
  if (c.filter_listing_count != null) highlights.push(`~${c.filter_listing_count} объявл. в фильтре`);

  return {
    id: `house-kg-${c.slug}`,
    slug: c.slug,
    name: c.name,
    type: ["Строительная компания", "Застройщик"],
    tagline: c.description?.trim() || "Компания в каталоге объявлений house.kg",
    description: [
      `Данные из house.kg${scrapedDate ? ` (выгрузка ${scrapedDate})` : ""}.`,
      c.description?.trim() || "",
      c.physical_address ? `Адрес офиса: ${c.physical_address}` : "",
      c.listing_tab_labels?.length ? `Разделы на профиле: ${c.listing_tab_labels.join(", ")}` : "",
      c.url ? `Страница: ${c.url}` : "",
    ]
      .filter(Boolean)
      .join("\n\n"),
    services: ["Жилое строительство", "Недвижимость"],
    specializations: ["Многоэтажное строительство", "Строительство домов"],
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
