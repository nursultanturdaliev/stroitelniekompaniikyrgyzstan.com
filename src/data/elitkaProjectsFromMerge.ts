import {
  elitkaConstructionStatusLabel,
  formatIsoDateRu,
  plannedMonthsBetween,
  scheduleSlipNoteRu,
} from "@/lib/elitkaSchedule";
import { buildElitkaObjectFactsFromDetail } from "@/lib/elitkaObjectFacts";
import { elitkaObjectImageUrls } from "@/lib/elitkaMedia";
import { passportEntryForUrl } from "@/lib/minstroyPassportSnapshot";
import type { CompletedProject, ElitkaObjectFacts, ServiceCategory } from "@/types/company";
import mergedRaw from "../../scraped/merged-companies.json";

type ElitkaObjectDetail = Record<string, unknown>;

type ElitkaObjectJson = {
  id?: number;
  title: string;
  slug: string;
  address: string;
  price_usd_m2: string;
  price_kgs_m2: string;
  gosstroy_registry: string | null;
  finish: string | null;
  main_img?: string | null;
  detail?: ElitkaObjectDetail;
};

type ElitkaBuilderJson = {
  name: string;
  slug: string;
  objects: ElitkaObjectJson[];
};

export type ProjectCrossListing = {
  source_label: string;
  url: string;
  title?: string;
  note?: string;
};

type MergedRoots = {
  scrapedAt: string;
  sources: {
    elitka: { builders: ElitkaBuilderJson[] };
    /** Опционально: сопоставление объявлений с других площадок (заполняется скриптом). */
    project_cross_listings?: {
      note_ru?: string;
      by_elitka_object_id?: Record<string, ProjectCrossListing[]>;
    };
  };
};

const merged = mergedRaw as unknown as MergedRoots;

function normalizeCrossListings(raw: unknown): ProjectCrossListing[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const out: ProjectCrossListing[] = [];
  for (const it of raw) {
    if (!it || typeof it !== "object") continue;
    const o = it as Record<string, unknown>;
    const source_label = typeof o.source_label === "string" ? o.source_label.trim() : "";
    const url = typeof o.url === "string" && o.url.trim().startsWith("http") ? o.url.trim() : "";
    if (!source_label || !url) continue;
    const row: ProjectCrossListing = { source_label, url };
    if (typeof o.title === "string" && o.title.trim()) row.title = o.title.trim();
    if (typeof o.note === "string" && o.note.trim()) row.note = o.note.trim();
    out.push(row);
  }
  return out.length ? out : undefined;
}

function projectTypeFromTitle(title: string): ServiceCategory {
  const t = title.toLowerCase();
  if (t.includes("жк") || t.includes("комплекс")) return "Многоэтажное строительство";
  return "Строительство домов";
}

/** Сегмент цены за м² ($), для фильтра каталога объектов. */
export type ElitkaProjectPriceTier = "budget" | "mid" | "premium" | "luxury" | "unknown";

export type ElitkaProjectListItem = {
  projectId: string;
  elitkaObjectId: number;
  title: string;
  address: string;
  builderSlug: string;
  builderName: string;
  slug: string;
  statusCode?: string;
  statusLabel?: string;
  cityId?: number;
  districtId?: number;
  subdistricts: string[];
  priceUsdM2: number | null;
  priceTier: ElitkaProjectPriceTier;
  displayPriceUsdM2?: string;
  displayPriceKgsM2?: string;
  passportUrl?: string;
  thumbUrl: string | null;
  plannedFinishDisplay?: string;
  projectType: ServiceCategory;
  lat?: number;
  lng?: number;
};

function parseUsdM2(raw: string | undefined): number | null {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (!s || s === "0") return null;
  const n = Number.parseFloat(s.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function priceTierFromUsd(usd: number | null): ElitkaProjectPriceTier {
  if (usd == null) return "unknown";
  if (usd < 1100) return "budget";
  if (usd < 1600) return "mid";
  if (usd < 2200) return "premium";
  return "luxury";
}

function pageDataToListItem(full: ElitkaProjectPageData, o: ElitkaObjectJson): ElitkaProjectListItem {
  const d = o.detail;
  const statusRaw = typeof d?.status === "string" ? d.status : undefined;
  const cityId = typeof d?.city_id === "number" ? Math.round(d.city_id) : undefined;
  const districtId = typeof d?.district_id === "number" ? Math.round(d.district_id) : undefined;
  const subdistricts = full.elitkaFacts?.subdistrictNames?.filter(Boolean) ?? [];
  const usd =
    parseUsdM2(full.displayPriceUsdM2) ??
    (typeof o.price_usd_m2 === "string" ? parseUsdM2(o.price_usd_m2) : null);

  return {
    projectId: full.projectId,
    elitkaObjectId: full.elitkaObjectId,
    title: full.title,
    address: full.address,
    builderSlug: full.builderSlug,
    builderName: full.builderName,
    slug: o.slug,
    statusCode: statusRaw,
    statusLabel: full.statusLabel,
    cityId,
    districtId,
    subdistricts,
    priceUsdM2: usd,
    priceTier: priceTierFromUsd(usd),
    displayPriceUsdM2: full.displayPriceUsdM2,
    displayPriceKgsM2: full.displayPriceKgsM2,
    passportUrl: full.passportUrl,
    thumbUrl: full.galleryImageUrls[0] ?? null,
    plannedFinishDisplay: full.plannedFinishDisplay,
    projectType: full.projectType,
    lat: full.lat,
    lng: full.lng,
  };
}

export type ElitkaProjectFilterMeta = {
  builders: { slug: string; name: string }[];
  /** Популярные подписи районов из каталога (elitka). */
  subdistrictOptions: string[];
};

export function getElitkaProjectFilterMeta(list: ElitkaProjectListItem[]): ElitkaProjectFilterMeta {
  const builders = new Map<string, string>();
  const subCount = new Map<string, number>();
  for (const p of list) {
    if (!builders.has(p.builderSlug)) builders.set(p.builderSlug, p.builderName);
    for (const s of p.subdistricts) {
      const k = s.trim();
      if (k) subCount.set(k, (subCount.get(k) ?? 0) + 1);
    }
  }
  const builderArr = [...builders.entries()]
    .map(([slug, name]) => ({ slug, name }))
    .sort((a, b) => a.name.localeCompare(b.name, "ru"));
  const subdistrictOptions = [...subCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 48)
    .map(([label]) => label);
  return { builders: builderArr, subdistrictOptions };
}

/** Все объекты elitka для каталога /projects/ и сравнения. */
export function getElitkaProjectsList(): ElitkaProjectListItem[] {
  const scrapedAt = merged.scrapedAt;
  const seen = new Set<number>();
  const out: ElitkaProjectListItem[] = [];
  for (const b of merged.sources.elitka.builders) {
    for (const o of b.objects) {
      if (typeof o.id !== "number" || seen.has(o.id)) continue;
      seen.add(o.id);
      const full = objectToPageData(b, o, scrapedAt);
      if (!full) continue;
      out.push(pageDataToListItem(full, o));
    }
  }
  out.sort((a, b) => a.title.localeCompare(b.title, "ru"));
  return out;
}

export type ElitkaProjectPageData = {
  projectId: string;
  scrapedAt: string;
  builderSlug: string;
  builderName: string;
  title: string;
  address: string;
  elitkaObjectId: number;
  /** city_id из detail elitka, если есть */
  cityId?: number;
  /** district_id из detail elitka, если есть */
  districtId?: number;
  lat?: number;
  lng?: number;
  passportUrl?: string;
  /** Сырой код статуса из elitka (например IN_PROGRESS), если есть в detail */
  statusCode?: string;
  statusLabel?: string;
  plannedStartDisplay?: string;
  plannedFinishDisplay?: string;
  initialPlannedFinishDisplay?: string;
  plannedDurationMonths?: number;
  scheduleSlipNote?: string;
  projectType: ServiceCategory;
  passportSnapshot?: CompletedProject["passportSnapshot"];
  elitkaFacts?: ElitkaObjectFacts;
  galleryImageUrls: string[];
  /** Цены из строки списка elitka (когда в detail нет price_usd/price_kgs за м²). */
  listPriceUsdM2?: string;
  listPriceKgsM2?: string;
  /** Цены для показа: деталь приоритетнее списка. */
  displayPriceUsdM2?: string;
  displayPriceKgsM2?: string;
  crossListings?: ProjectCrossListing[];
  expertAnalytics: ProjectExpertAnalytics;
};

export type ProjectExpertAnalytics = {
  confidence: "low" | "medium" | "high";
  score: number;
  verdict: string;
  strengths: string[];
  risks: string[];
  questions: string[];
};

function buildExpertAnalytics(input: {
  statusCode?: string;
  passportUrl?: string;
  hasPassportSnapshot: boolean;
  passportSnapshotHasError: boolean;
  displayPriceUsdM2?: string;
  displayPriceKgsM2?: string;
  plannedFinishDisplay?: string;
  scheduleSlipNote?: string;
  cityId?: number;
  hasCoordinates: boolean;
  subdistrictCount: number;
}): ProjectExpertAnalytics {
  const strengths: string[] = [];
  const risks: string[] = [];
  const questions: string[] = [];

  let score = 50;

  if (input.passportUrl) {
    score += 12;
    strengths.push("Есть ссылка на паспорт объекта Минстроя в карточке.");
  } else {
    score -= 14;
    risks.push("Нет ссылки на паспорт объекта в данных выгрузки.");
    questions.push("Попросите у отдела продаж официальный URL паспорта на minstroy.gov.kg.");
  }

  if (input.hasPassportSnapshot && !input.passportSnapshotHasError) {
    score += 8;
    strengths.push("Есть снимок полей паспорта из последней выгрузки.");
  } else if (input.passportSnapshotHasError) {
    score -= 6;
    risks.push("Снимок паспорта в выгрузке содержит ошибку парсинга.");
    questions.push("Откройте сам паспорт на сайте Минстроя и сверьте поля вручную.");
  }

  if (input.displayPriceUsdM2 && input.displayPriceKgsM2) {
    score += 7;
    strengths.push("Указаны ориентиры цены и в $/м², и в сом/м².");
    questions.push("Уточните, по какому курсу и на какую дату фиксируется платеж в договоре.");
  } else if (!input.displayPriceUsdM2 && !input.displayPriceKgsM2) {
    score -= 8;
    risks.push("В карточке нет читаемого ориентира цены за м².");
  } else {
    score -= 2;
    risks.push("Цена представлена только в одной валюте; проверяйте эквивалент.");
  }

  if (input.plannedFinishDisplay) {
    score += 4;
    strengths.push("Есть плановая дата сдачи в открытых данных.");
  } else {
    score -= 5;
    risks.push("Не указана плановая дата сдачи.");
  }

  if (input.scheduleSlipNote) {
    score -= 7;
    risks.push("Есть сигнал о переносе плановых сроков между версиями данных.");
    questions.push("Уточните у застройщика актуальную дату сдачи и основания переноса.");
  }

  if (input.statusCode === "IN_PROGRESS") {
    score += 2;
  } else if (input.statusCode === "PLANNED") {
    score -= 3;
    risks.push("Статус в данных: запланирован, объект может быть на ранней стадии.");
  } else if (input.statusCode === "SUSPENDED") {
    score -= 12;
    risks.push("Статус в данных: приостановлен.");
    questions.push("Попросите официальный комментарий о причинах и сроках возобновления.");
  }

  if (input.cityId != null) score += 3;
  if (input.hasCoordinates) score += 4;
  if (input.subdistrictCount > 0) score += 3;

  score = Math.max(0, Math.min(100, score));

  let confidence: "low" | "medium" | "high" = "low";
  if (score >= 70) confidence = "high";
  else if (score >= 45) confidence = "medium";

  let verdict = "Недостаточно подтверждающих данных: проверка обязательна перед сделкой.";
  if (score >= 75) verdict = "Хорошая базовая прозрачность по открытым источникам, но договор проверяйте отдельно.";
  else if (score >= 55) verdict = "Есть рабочий минимум данных, однако остаются вопросы к деталям сделки и срокам.";

  if (questions.length === 0) {
    questions.push("Сверьте стороны договора с карточкой компании и реестром перед подписанием.");
  }

  return {
    confidence,
    score,
    verdict,
    strengths: strengths.slice(0, 5),
    risks: risks.slice(0, 5),
    questions: questions.slice(0, 5),
  };
}

function objectToPageData(
  builder: ElitkaBuilderJson,
  o: ElitkaObjectJson,
  scrapedAt: string,
): ElitkaProjectPageData | null {
  const oid = typeof o.id === "number" ? o.id : undefined;
  if (oid == null) return null;
  const d = o.detail;
  const startIso = typeof d?.construction_start_date === "string" ? d.construction_start_date : undefined;
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
  const lat = typeof d?.lat === "number" ? d.lat : undefined;
  const lng = typeof d?.lon === "number" ? d.lon : undefined;
  const pSnap = regUrl ? passportEntryForUrl(regUrl) : undefined;
  const hasSnap = pSnap && (Object.keys(pSnap.fields || {}).length > 0 || pSnap.error);
  const passportSnapshot = hasSnap
    ? {
        fetchedAt: pSnap!.fetched_at,
        httpStatus: pSnap!.http_status,
        parseError: pSnap!.error ?? undefined,
        fields: pSnap!.fields || {},
      }
    : undefined;

  const dRecord = d && typeof d === "object" ? (d as Record<string, unknown>) : undefined;
  const elitkaFacts = buildElitkaObjectFactsFromDetail(dRecord, o.slug);
  const mainForGallery =
    (typeof dRecord?.main_img === "string" ? dRecord.main_img : null) ||
    (typeof o.main_img === "string" ? o.main_img : null) ||
    undefined;
  const galleryImageUrls = elitkaObjectImageUrls(oid, mainForGallery, dRecord?.images ?? null, 16);

  const listUsd = typeof o.price_usd_m2 === "string" ? o.price_usd_m2.trim() : "";
  const listKgs = typeof o.price_kgs_m2 === "string" ? o.price_kgs_m2.trim() : "";
  const hasListUsd = listUsd && listUsd !== "0";
  const hasListKgs = listKgs && listKgs !== "0";

  const detailUsd = elitkaFacts?.detailPriceUsd != null ? String(elitkaFacts.detailPriceUsd).trim() : "";
  const detailKgs = elitkaFacts?.detailPriceKgs != null ? String(elitkaFacts.detailPriceKgs).trim() : "";
  const hasDetailUsd = detailUsd && detailUsd !== "0";
  const hasDetailKgs = detailKgs && detailKgs !== "0";

  const crossBlock = merged.sources.project_cross_listings;
  const crossRaw =
    crossBlock?.by_elitka_object_id?.[String(oid)] ?? crossBlock?.by_elitka_object_id?.[`${oid}`];
  const crossListings = normalizeCrossListings(crossRaw);

  const cityId = typeof d?.city_id === "number" ? Math.round(d.city_id) : undefined;
  const districtId = typeof d?.district_id === "number" ? Math.round(d.district_id) : undefined;
  const expertAnalytics = buildExpertAnalytics({
    statusCode: statusRaw,
    passportUrl: regUrl ?? undefined,
    hasPassportSnapshot: !!passportSnapshot,
    passportSnapshotHasError: !!passportSnapshot?.parseError,
    displayPriceUsdM2: hasDetailUsd ? detailUsd : hasListUsd ? listUsd : undefined,
    displayPriceKgsM2: hasDetailKgs ? detailKgs : hasListKgs ? listKgs : undefined,
    plannedFinishDisplay: formatIsoDateRu(finishIso),
    scheduleSlipNote: scheduleSlipNoteRu(initialFinishIso, finishIso),
    cityId,
    hasCoordinates: lat != null && lng != null,
    subdistrictCount: elitkaFacts?.subdistrictNames?.length ?? 0,
  });

  return {
    projectId: `elitka-${oid}`,
    scrapedAt,
    builderSlug: builder.slug,
    builderName: builder.name,
    title: o.title,
    address: o.address.trim(),
    elitkaObjectId: oid,
    cityId,
    districtId,
    lat,
    lng,
    passportUrl: regUrl ?? undefined,
    statusCode: statusRaw,
    statusLabel: elitkaConstructionStatusLabel(statusRaw),
    plannedStartDisplay: formatIsoDateRu(startIso),
    plannedFinishDisplay: formatIsoDateRu(finishIso),
    initialPlannedFinishDisplay:
      initialFinishIso && finishIso && initialFinishIso !== finishIso ? formatIsoDateRu(initialFinishIso) : undefined,
    plannedDurationMonths: plannedMonthsBetween(startIso, finishIso),
    scheduleSlipNote: scheduleSlipNoteRu(initialFinishIso, finishIso),
    projectType: projectTypeFromTitle(o.title),
    passportSnapshot,
    elitkaFacts,
    galleryImageUrls,
    listPriceUsdM2: hasListUsd ? listUsd : undefined,
    listPriceKgsM2: hasListKgs ? listKgs : undefined,
    displayPriceUsdM2: hasDetailUsd ? detailUsd : hasListUsd ? listUsd : undefined,
    displayPriceKgsM2: hasDetailKgs ? detailKgs : hasListKgs ? listKgs : undefined,
    crossListings,
    expertAnalytics,
  };
}

/** Статические маршруты `/projects/elitka-{id}/` без дублирования id. */
export function getElitkaProjectStaticParams(): { projectId: string }[] {
  const seen = new Set<number>();
  const out: { projectId: string }[] = [];
  for (const b of merged.sources.elitka.builders) {
    for (const o of b.objects) {
      if (typeof o.id !== "number" || seen.has(o.id)) continue;
      seen.add(o.id);
      out.push({ projectId: `elitka-${o.id}` });
    }
  }
  return out;
}

export function getElitkaProjectPageData(projectId: string): ElitkaProjectPageData | null {
  if (!projectId.startsWith("elitka-")) return null;
  const nid = Number.parseInt(projectId.slice("elitka-".length), 10);
  if (!Number.isFinite(nid)) return null;
  const scrapedAt = merged.scrapedAt;
  for (const b of merged.sources.elitka.builders) {
    for (const o of b.objects) {
      if (o.id === nid) return objectToPageData(b, o, scrapedAt);
    }
  }
  return null;
}
