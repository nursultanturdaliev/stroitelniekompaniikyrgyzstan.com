import mergedRaw from "../../scraped/merged-companies.json";
import type { CompanyWebsiteSnapshot } from "@/types/company";

type RawEntry = {
  requested_url?: string;
  final_url?: string;
  fetched_at?: string;
  http_status?: number | null;
  error?: string | null;
  fields?: Record<string, string>;
  same_as?: string[];
  extra_pages_fetched?: string[];
};

type MergedRoots = {
  sources?: {
    company_website_snapshots?: {
      scrapedAt?: string;
      note_ru?: string;
      by_company_id?: Record<string, RawEntry>;
    };
  };
};

const merged = mergedRaw as unknown as MergedRoots;

function mapRawToSnapshot(raw: RawEntry): CompanyWebsiteSnapshot {
  return {
    requestedUrl: String(raw.requested_url ?? ""),
    finalUrl: raw.final_url ?? undefined,
    fetchedAt: raw.fetched_at,
    httpStatus: raw.http_status ?? undefined,
    parseError: raw.error ?? undefined,
    fields: raw.fields && typeof raw.fields === "object" ? raw.fields : {},
    sameAs: Array.isArray(raw.same_as) ? raw.same_as : undefined,
    extraPagesFetched: Array.isArray(raw.extra_pages_fetched) ? raw.extra_pages_fetched : undefined,
  };
}

/** Снимок сайта по id карточки (`elitka-{id}-{slug}` / `house-kg-{slug}`). */
export function websiteSnapshotForCompanyId(companyId: string): CompanyWebsiteSnapshot | undefined {
  const by = merged.sources?.company_website_snapshots?.by_company_id;
  if (!by || typeof by !== "object") return undefined;
  const raw = by[companyId];
  if (!raw || typeof raw !== "object") return undefined;
  return mapRawToSnapshot(raw);
}

export function companyWebsiteSnapshotsMeta(): { scrapedAt?: string; noteRu?: string } {
  const w = merged.sources?.company_website_snapshots;
  return { scrapedAt: w?.scrapedAt, noteRu: w?.note_ru };
}
