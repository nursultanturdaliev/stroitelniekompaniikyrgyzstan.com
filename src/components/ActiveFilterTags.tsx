"use client";

import type { CompanyFilterState, LicenseFilter } from "./FilterPanel";
import type { CompanyType, ServiceCategory } from "@/types/company";

const priceLabels: Record<string, string> = {
  budget: "Бюджетный",
  mid: "Средний",
  premium: "Премиум",
  luxury: "Люкс",
};

const experienceLabels: Record<string, string> = {
  "1-3": "1–3 года",
  "4-7": "4–7 лет",
  "8-15": "8–15 лет",
  "16+": "16+ лет",
};

const licenseLabels: Record<LicenseFilter, string> = {
  all: "",
  yes: "С лицензией",
  no: "Без лицензии (ИП и т.п.)",
};

interface ActiveFilterTagsProps {
  filters: CompanyFilterState;
  onChange: (filters: CompanyFilterState) => void;
}

function Tag({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-[var(--steel-blue)]/10 text-[var(--steel-blue)] rounded-full">
      {label}
      <button type="button" onClick={onRemove} className="ml-0.5 hover:text-[var(--safety-orange)] transition-colors">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </span>
  );
}

export default function ActiveFilterTags({ filters, onChange }: ActiveFilterTagsProps) {
  const tags: { label: string; remove: () => void }[] = [];

  if (filters.minRating > 0) {
    tags.push({
      label: `${filters.minRating}+ ★`,
      remove: () => onChange({ ...filters, minRating: 0 }),
    });
  }

  filters.companyTypes.forEach((t: CompanyType) => {
    tags.push({
      label: t,
      remove: () => onChange({ ...filters, companyTypes: filters.companyTypes.filter((x) => x !== t) }),
    });
  });

  filters.specializations.forEach((s: ServiceCategory) => {
    tags.push({
      label: s,
      remove: () => onChange({ ...filters, specializations: filters.specializations.filter((x) => x !== s) }),
    });
  });

  filters.priceRange.forEach((price) => {
    tags.push({
      label: priceLabels[price] || price,
      remove: () => onChange({ ...filters, priceRange: filters.priceRange.filter((p) => p !== price) }),
    });
  });

  filters.experienceRange.forEach((exp) => {
    tags.push({
      label: experienceLabels[exp] || exp,
      remove: () => onChange({ ...filters, experienceRange: filters.experienceRange.filter((e) => e !== exp) }),
    });
  });

  filters.cities.forEach((city) => {
    tags.push({
      label: city,
      remove: () => onChange({ ...filters, cities: filters.cities.filter((c) => c !== city) }),
    });
  });

  if (filters.license !== "all") {
    tags.push({
      label: licenseLabels[filters.license],
      remove: () => onChange({ ...filters, license: "all" }),
    });
  }

  if (filters.hasWebsite) tags.push({ label: "Есть сайт", remove: () => onChange({ ...filters, hasWebsite: false }) });
  if (filters.has2gis) tags.push({ label: "Есть 2ГИС", remove: () => onChange({ ...filters, has2gis: false }) });
  if (filters.hideMinstroyBlacklistWarnings) {
    tags.push({
      label: "Скрыты предупреждения ЧС",
      remove: () => onChange({ ...filters, hideMinstroyBlacklistWarnings: false }),
    });
  }

  if (tags.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {tags.map((tag, i) => (
        <Tag key={`${tag.label}-${i}`} label={tag.label} onRemove={tag.remove} />
      ))}
      {tags.length > 2 && (
        <button
          type="button"
          onClick={() =>
            onChange({
              ...filters,
              companyTypes: [],
              specializations: [],
              priceRange: [],
              minRating: 0,
              experienceRange: [],
              cities: [],
              license: "all",
              hasWebsite: false,
              has2gis: false,
              hideMinstroyBlacklistWarnings: false,
            })
          }
          className="text-xs text-[var(--slate-blue)] hover:text-[var(--safety-orange)] underline ml-1"
        >
          Очистить все
        </button>
      )}
    </div>
  );
}
