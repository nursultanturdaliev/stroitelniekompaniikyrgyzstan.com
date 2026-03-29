import mergedRaw from "../../scraped/merged-companies.json";

export type MinstroyPassportPageEntry = {
  http_status: number | null;
  error: string | null;
  fields: Record<string, string>;
  fetched_at?: string;
};

type MergedRoots = {
  sources?: {
    minstroy?: {
      passport_pages?: {
        scrapedAt?: string;
        note_ru?: string;
        by_url?: Record<string, MinstroyPassportPageEntry>;
      };
    };
  };
};

const merged = mergedRaw as unknown as MergedRoots;

export function normalizeMinstroyPassportUrl(url: string): string {
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

/** Снимок страницы паспорта по URL из merged JSON (учёт ru/kg и канонизации). */
export function passportEntryForUrl(url: string | undefined | null): MinstroyPassportPageEntry | undefined {
  if (!url || !url.startsWith("http")) return undefined;
  const by = merged.sources?.minstroy?.passport_pages?.by_url;
  if (!by || typeof by !== "object") return undefined;
  const nu = normalizeMinstroyPassportUrl(url);
  const direct = by[nu] as MinstroyPassportPageEntry | undefined;
  if (direct) return direct;
  const m = url.match(/\/(?:legal|passport)\/(?:legal\/)?(\d+)/i) ?? url.match(/\/legal\/(\d+)/i);
  const id = m?.[1];
  if (!id) return undefined;
  for (const k of Object.keys(by)) {
    if (k.includes(`/legal/${id}`)) return by[k] as MinstroyPassportPageEntry;
  }
  return undefined;
}

export function minstroyPassportPagesMeta(): { scrapedAt?: string; noteRu?: string } {
  const pp = merged.sources?.minstroy?.passport_pages;
  return { scrapedAt: pp?.scrapedAt, noteRu: pp?.note_ru };
}
