import { elitkaConstructionStatusLabel } from "@/lib/elitkaSchedule";
import { inferCityFromAddress } from "@/lib/geoKg";
import type { ConstructionCompany, PriceRangeTier } from "@/types/company";

/** Рядом с числом совпадений реестра — обязательный текст плана. */
export const MINSTROY_REGISTRY_DISCLAIMER =
  "Совпадения со строками реестра Минстроя получены автоматически по названию компании или ИНН; это не официальное заключение ведомства. Уточняйте статус только на сайте Минстроя.";

const PRICE_RANGE_LABELS: Record<PriceRangeTier, string> = {
  budget: "эконом",
  mid: "средний",
  premium: "повышенный",
  luxury: "премиум",
};

export type CompanyStatusBucket = {
  code: string;
  label: string;
  count: number;
};

export type CompanyInsights = {
  sampleSize: number;
  totalInCatalog: number;
  totalExceedsSample: boolean;
  sampleScopeNote?: string;
  /** Нет объектов в выборке — короткое пояснение для карточки. */
  minimalNote?: string;
  passportUrlCount: number;
  passportSnapshotCount: number;
  scheduleSlipCount: number;
  passportUrlPercent: number;
  passportSnapshotPercent: number;
  statusBuckets: CompanyStatusBucket[];
  distinctCities: string[];
  priceRangeTier: PriceRangeTier;
  priceRangeLabel: string;
  priceNote?: string;
  hasLicense: boolean;
  minstroyBlacklistWarning: boolean;
  minstroyRegistryMatchCount?: number;
  registryDisclaimer: string;
  officialRegistryUrl: string;
};

function pct(n: number, d: number): number {
  if (d <= 0) return 0;
  return Math.round((100 * n) / d);
}

function cityFromProjectDescription(description: string): string {
  const first = description.split("\n")[0]?.trim() || description.trim();
  return inferCityFromAddress(first || "");
}

export function computeCompanyInsights(
  company: ConstructionCompany,
  officialRegistryUrl = "https://minstroy.gov.kg/ru/license/reestr",
): CompanyInsights | null {
  const projects = company.completedProjects ?? [];
  const sampleSize = projects.length;
  const totalInCatalog = company.projectCount ?? sampleSize;
  const totalExceedsSample = totalInCatalog > sampleSize;
  const registryCount = company.minstroyRegistryMatchCount;

  const passportUrlCount = projects.filter((p) => Boolean(p.passportUrl)).length;
  const passportSnapshotCount = projects.filter(
    (p) => p.passportSnapshot && Object.keys(p.passportSnapshot.fields ?? {}).length > 0,
  ).length;
  const scheduleSlipCount = projects.filter((p) => Boolean(p.scheduleSlipNote)).length;

  const statusMap = new Map<string, number>();
  for (const p of projects) {
    const code = p.elitkaConstructionStatusCode?.trim();
    if (!code) continue;
    statusMap.set(code, (statusMap.get(code) ?? 0) + 1);
  }
  const statusBuckets: CompanyStatusBucket[] = [...statusMap.entries()]
    .map(([code, count]) => ({
      code,
      label: elitkaConstructionStatusLabel(code) ?? code,
      count,
    }))
    .sort((a, b) => b.count - a.count);

  const citySet = new Set<string>();
  for (const p of projects) {
    citySet.add(cityFromProjectDescription(p.description));
  }
  const distinctCities = [...citySet].sort((a, b) => a.localeCompare(b, "ru"));

  const shouldShow =
    sampleSize > 0 ||
    company.minstroyRegistryMatchCount !== undefined ||
    Boolean(company.minstroyBlacklistWarning) ||
    company.hasLicense;

  if (!shouldShow) {
    return null;
  }

  let minimalNote: string | undefined;
  if (sampleSize === 0) {
    minimalNote =
      "В этой карточке нет объектов новостроек из выгрузки каталога — сводка по паспортам и статусам объектов недоступна.";
  }

  const scopeNote =
    totalExceedsSample && sampleSize > 0
      ? `По ${sampleSize} объектам, показанным ниже в разделе «Проекты» (в каталоге новостроек у компании указано ${totalInCatalog}). Доли и проценты считаются только по этой выборке.`
      : undefined;

  return {
    sampleSize,
    totalInCatalog,
    totalExceedsSample,
    sampleScopeNote: scopeNote,
    minimalNote,
    passportUrlCount,
    passportSnapshotCount,
    scheduleSlipCount,
    passportUrlPercent: pct(passportUrlCount, sampleSize),
    passportSnapshotPercent: pct(passportSnapshotCount, sampleSize),
    statusBuckets,
    distinctCities,
    priceRangeTier: company.priceRange,
    priceRangeLabel: PRICE_RANGE_LABELS[company.priceRange],
    priceNote: company.priceNote,
    hasLicense: company.hasLicense,
    minstroyBlacklistWarning: Boolean(company.minstroyBlacklistWarning),
    minstroyRegistryMatchCount: registryCount,
    registryDisclaimer: MINSTROY_REGISTRY_DISCLAIMER,
    officialRegistryUrl,
  };
}
