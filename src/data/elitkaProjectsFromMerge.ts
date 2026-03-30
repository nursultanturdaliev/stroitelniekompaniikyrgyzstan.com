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
  lat?: number;
  lng?: number;
  passportUrl?: string;
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
};

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

  return {
    projectId: `elitka-${oid}`,
    scrapedAt,
    builderSlug: builder.slug,
    builderName: builder.name,
    title: o.title,
    address: o.address.trim(),
    elitkaObjectId: oid,
    lat,
    lng,
    passportUrl: regUrl ?? undefined,
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
