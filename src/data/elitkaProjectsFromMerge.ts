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

type MergedRoots = {
  scrapedAt: string;
  sources: { elitka: { builders: ElitkaBuilderJson[] } };
};

const merged = mergedRaw as unknown as MergedRoots;

function projectTypeFromTitle(title: string): ServiceCategory {
  const t = title.toLowerCase();
  if (t.includes("жк") || t.includes("комплекс")) return "Многоэтажное строительство";
  return "Строительство домов";
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
