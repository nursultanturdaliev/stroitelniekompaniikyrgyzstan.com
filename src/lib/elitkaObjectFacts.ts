import type {
  ElitkaCharacteristicRow,
  ElitkaObjectFacts,
  ElitkaRelatedBuildingRef,
  ElitkaRoomCountKey,
} from "@/types/company";

const ROOM_KEYS: ElitkaRoomCountKey[] = [
  "one_room_flats",
  "one_room_studio_flats",
  "two_room_flats",
  "two_room_studio_flats",
  "three_room_flats",
  "three_room_studio_flats",
  "four_room_flats",
  "four_room_studio_flats",
  "five_room_flats",
  "five_room_studio_flats",
];

function num(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim()) {
    const n = Number.parseFloat(v.replace(",", "."));
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

function str(v: unknown): string | undefined {
  if (v == null) return undefined;
  const s = String(v).trim();
  return s || undefined;
}

function normalizeCharacteristics(d: Record<string, unknown>): ElitkaCharacteristicRow[] | undefined {
  const raw = d.characteristics;
  if (!Array.isArray(raw)) return undefined;
  const out: ElitkaCharacteristicRow[] = [];
  for (const it of raw) {
    if (!it || typeof it !== "object") continue;
    const o = it as Record<string, unknown>;
    if (typeof o.name === "string" && o.name.trim()) {
      out.push({ name: o.name.trim(), value: String(o.value ?? "").trim() });
      continue;
    }
    const ch = o.characteristic;
    if (ch && typeof ch === "object" && typeof (ch as { name?: unknown }).name === "string") {
      const name = String((ch as { name: string }).name).trim();
      if (name) out.push({ name, value: String(o.value ?? "").trim() });
    }
  }
  return out.length ? out : undefined;
}

function normalizeRelated(d: Record<string, unknown>): ElitkaRelatedBuildingRef[] | undefined {
  const raw = d.related_objects;
  if (!Array.isArray(raw)) return undefined;
  const out: ElitkaRelatedBuildingRef[] = [];
  for (const it of raw) {
    if (!it || typeof it !== "object") continue;
    const o = it as Record<string, unknown>;
    const id = num(o.id);
    const slug = str(o.slug);
    const title = str(o.title);
    if (id == null || !slug || !title) continue;
    const row: ElitkaRelatedBuildingRef = { id: Math.round(id), slug, title };
    const ad = str(o.address);
    if (ad) row.address = ad;
    const gs = str(o.gosstroy_registry);
    if (gs?.startsWith("http")) row.gosstroy_registry = gs;
    out.push(row);
  }
  return out.length ? out : undefined;
}

function normalizeSubdistrictNames(d: Record<string, unknown>): string[] | undefined {
  const raw = d.subdistrict_names;
  if (!Array.isArray(raw)) return undefined;
  const names = raw
    .filter((x): x is string => typeof x === "string" && x.trim() !== "")
    .map((x) => x.trim());
  return names.length ? names : undefined;
}

function roomCountsFromDetail(d: Record<string, unknown>): Partial<Record<ElitkaRoomCountKey, number>> | undefined {
  const rc: Partial<Record<ElitkaRoomCountKey, number>> = {};
  for (const k of ROOM_KEYS) {
    const n = num(d[k]);
    if (n != null && n !== 0) rc[k] = Math.round(n);
  }
  return Object.keys(rc).length ? rc : undefined;
}

function progressFromDetail(d: Record<string, unknown>): ElitkaObjectFacts["constructionProgress"] {
  const raw = d.construction_progress;
  if (!Array.isArray(raw)) return undefined;
  const out: Array<Record<string, string | number | null | undefined>> = [];
  for (const it of raw) {
    if (!it || typeof it !== "object") continue;
    const o = it as Record<string, unknown>;
    const row: Record<string, string | number | null | undefined> = {};
    for (const key of ["date", "title", "percent", "progress", "description", "created_at", "updated_at"]) {
      const v = o[key];
      if (v != null && v !== "") row[key] = v as string | number;
    }
    if (Object.keys(row).length) out.push(row);
  }
  return out.length ? out : undefined;
}

function apartmentsFromDetail(d: Record<string, unknown>): ElitkaObjectFacts["apartments"] {
  const raw = d.apartments;
  if (!Array.isArray(raw)) return undefined;
  const out: Array<Record<string, string | number | null | undefined>> = [];
  for (const it of raw) {
    if (!it || typeof it !== "object") continue;
    const o = it as Record<string, unknown>;
    const row: Record<string, string | number | null | undefined> = {};
    for (const key of [
      "id",
      "floor",
      "rooms",
      "area",
      "living_area",
      "price_usd",
      "price_kgs",
      "title",
      "status",
      "number",
    ]) {
      const v = o[key];
      if (v != null && v !== "") row[key] = v as string | number;
    }
    if (Object.keys(row).length) out.push(row);
  }
  return out.length ? out : undefined;
}

/**
 * Собирает типизированные факты из `object.detail` в merged-companies.json
 * (ключи как после `slim_elitka_object_detail` в Python).
 */
export function buildElitkaObjectFactsFromDetail(
  detail: Record<string, unknown> | undefined,
  fallbackSlug?: string,
): ElitkaObjectFacts | undefined {
  if (!detail || typeof detail !== "object") return undefined;

  const d = detail;
  const facts: ElitkaObjectFacts = {};

  const slug = str(d.slug) ?? fallbackSlug;
  if (slug) facts.slug = slug;

  const cityId = num(d.city_id);
  if (cityId != null) facts.cityId = Math.round(cityId);
  const districtId = num(d.district_id);
  if (districtId != null) facts.districtId = Math.round(districtId);

  const blocks = num(d.blocks_count);
  if (blocks != null) facts.blocksCount = Math.round(blocks);
  const ceilH = d.ceiling_height;
  if (ceilH != null && ceilH !== "") facts.ceilingHeight = ceilH as string | number;

  const fc = num(d.floor_count);
  if (fc != null) facts.floorCount = Math.round(fc);
  const ec = num(d.entrances_count);
  if (ec != null) facts.entrancesCount = Math.round(ec);

  const oc = d.object_class;
  if (oc != null && oc !== "") facts.objectClass = oc as string | number;

  const tf = num(d.total_flats);
  if (tf != null) facts.totalFlats = Math.round(tf);
  const ta = d.total_area;
  if (ta != null && ta !== "") facts.totalArea = ta as string | number;
  const la = d.land_area;
  if (la != null && la !== "") facts.landArea = la as string | number;

  const heat = str(d.heat);
  if (heat) facts.heat = heat;
  const ct = str(d.construction_technology);
  if (ct) facts.constructionTechnology = ct;
  const wm = str(d.wall_material);
  if (wm) facts.wallMaterial = wm;
  const fac = str(d.facade);
  if (fac) facts.facade = fac;

  const uPark = d.underground_parking;
  if (uPark != null && uPark !== "") facts.undergroundParking = uPark as string | number | boolean;
  const sp = d.surface_parking;
  if (sp != null && sp !== "") facts.surfaceParking = sp as string | number | boolean;

  const ip = d.initial_payment;
  if (ip != null && ip !== "") facts.initialPayment = ip as string | number;
  const ins = d.installment_period;
  if (ins != null && ins !== "") facts.installmentPeriod = ins as string | number;

  const fid = str(d.finish_installment_date);
  if (fid) facts.finishInstallmentDate = fid;
  const fq = d.finish_quarter;
  if (fq != null && fq !== "") facts.finishQuarter = fq as string | number;
  const fy = num(d.finish_year);
  if (fy != null) facts.finishYear = Math.round(fy);
  const fm = num(d.finish_month);
  if (fm != null) facts.finishMonth = Math.round(fm);

  const ri = d.reliability_index;
  if (ri != null && ri !== "") facts.reliabilityIndex = ri as string | number;
  const qs = d.quality_score;
  if (qs != null && qs !== "") facts.qualityScore = qs as string | number;

  const rt = num(d.rating);
  if (rt != null) facts.rating = rt;
  const rc = num(d.reviews_count);
  if (rc != null) facts.reviewsCount = Math.round(rc);
  const vc = num(d.view_count);
  if (vc != null) facts.viewCount = Math.round(vc);
  const cc = num(d.call_count);
  if (cc != null) facts.callCount = Math.round(cc);
  const sc = num(d.show_count);
  if (sc != null) facts.showCount = Math.round(sc);

  if (d.is_promoted === true) facts.isPromoted = true;

  const dp = str(d.doc_presentation);
  if (dp) facts.docPresentation = dp;
  const dse = str(d.doc_state_expertise);
  if (dse) facts.docStateExpertise = dse;
  const dm = str(d.doc_master_plan);
  if (dm) facts.docMasterPlan = dm;
  const dop = str(d.doc_object_passport);
  if (dop) facts.docObjectPassport = dop;
  const dtf = str(d.doc_typical_floor_plan);
  if (dtf) facts.docTypicalFloorPlan = dtf;
  const da = str(d.doc_area);
  if (da) facts.docArea = da;

  const pdu = d.price_usd;
  if (pdu != null && pdu !== "") facts.detailPriceUsd = pdu as string | number;
  const pdk = d.price_kgs;
  if (pdk != null && pdk !== "") facts.detailPriceKgs = pdk as string | number;

  const cr = str(d.created_at);
  if (cr) facts.createdAt = cr;
  const upd = str(d.updated_at);
  if (upd) facts.updatedAt = upd;

  const ch = normalizeCharacteristics(d);
  if (ch) facts.characteristics = ch;
  const sd = normalizeSubdistrictNames(d);
  if (sd) facts.subdistrictNames = sd;
  const rel = normalizeRelated(d);
  if (rel) facts.relatedBuildings = rel;
  const pr = progressFromDetail(d);
  if (pr) facts.constructionProgress = pr;
  const apt = apartmentsFromDetail(d);
  if (apt) facts.apartments = apt;

  const rooms = roomCountsFromDetail(d);
  if (rooms) facts.roomCounts = rooms;

  if (d.labels != null && d.labels !== "") facts.labels = d.labels;

  return Object.keys(facts).length ? facts : undefined;
}

export const ELITKA_ROOM_COUNT_LABELS: Record<ElitkaRoomCountKey, string> = {
  one_room_flats: "1-комн.",
  one_room_studio_flats: "Студии (1-к.)",
  two_room_flats: "2-комн.",
  two_room_studio_flats: "2-к. студии",
  three_room_flats: "3-комн.",
  three_room_studio_flats: "3-к. студии",
  four_room_flats: "4-комн.",
  four_room_studio_flats: "4-к. студии",
  five_room_flats: "5-комн.",
  five_room_studio_flats: "5-к. студии",
};

export const ELITKA_DOC_LABELS: Record<string, string> = {
  docPresentation: "Презентация",
  docStateExpertise: "Госэкспертиза",
  docMasterPlan: "Генплан",
  docObjectPassport: "Паспорт объекта (файл)",
  docTypicalFloorPlan: "Типовой этаж",
  docArea: "Площади (документ)",
};
