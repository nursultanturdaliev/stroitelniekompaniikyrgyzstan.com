"use client";

import { useState } from "react";
import type { CompanyType, ServiceCategory } from "@/types/company";

export type SortOption =
  | "rating"
  | "experience"
  | "projects"
  | "price-asc"
  | "price-desc"
  | "reviews"
  | "name";

export type LicenseFilter = "all" | "yes" | "no";

export interface CompanyFilterState {
  companyTypes: CompanyType[];
  specializations: ServiceCategory[];
  priceRange: string[];
  sortBy: SortOption;
  minRating: number;
  experienceRange: string[];
  cities: string[];
  license: LicenseFilter;
  searchQuery: string;
  hasWebsite: boolean;
  has2gis: boolean;
  /** Скрыть карточки с предупреждением по чёрному списку (автосопоставление) */
  hideMinstroyBlacklistWarnings: boolean;
}

export const defaultCompanyFilters: CompanyFilterState = {
  companyTypes: [],
  specializations: [],
  priceRange: [],
  sortBy: "rating",
  minRating: 0,
  experienceRange: [],
  cities: [],
  license: "all",
  searchQuery: "",
  hasWebsite: false,
  has2gis: false,
  hideMinstroyBlacklistWarnings: false,
};

const allCompanyTypes: CompanyType[] = [
  "Строительная компания",
  "Застройщик",
  "Агентство недвижимости",
  "Проектная организация",
  "Ремонтная компания",
  "Дорожное строительство",
];

const allSpecializations: ServiceCategory[] = [
  "Строительство домов",
  "Многоэтажное строительство",
  "Ремонт квартир",
  "Проектирование",
  "Фундаментные работы",
  "Кровельные работы",
  "Фасадные работы",
  "Инженерные сети",
  "Благоустройство",
  "Дорожное строительство",
  "Риелторские услуги",
  "Аренда жилья",
  "Продажа вторичного жилья",
];

const priceRanges = [
  { value: "budget", label: "Бюджетный", sub: "эконом-сегмент" },
  { value: "mid", label: "Средний", sub: "стандарт" },
  { value: "premium", label: "Премиум", sub: "выше среднего" },
  { value: "luxury", label: "Люкс", sub: "индивидуально" },
];

const experienceRanges = [
  { value: "1-3", label: "1–3 года" },
  { value: "4-7", label: "4–7 лет" },
  { value: "8-15", label: "8–15 лет" },
  { value: "16+", label: "16+ лет" },
];

const cityOptions = ["Бишкек", "Ош", "Кант", "Каракол", "Токмок", "Кыргызстан"];

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "rating", label: "По рейтингу" },
  { value: "reviews", label: "По отзывам" },
  { value: "experience", label: "По опыту" },
  { value: "projects", label: "По проектам" },
  { value: "price-asc", label: "Цена: дешевле" },
  { value: "price-desc", label: "Цена: дороже" },
  { value: "name", label: "По алфавиту" },
];

interface FilterPanelProps {
  filters: CompanyFilterState;
  onChange: (filters: CompanyFilterState) => void;
  resultCount: number;
  totalCount: number;
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

function Section({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-100 last:border-0 pb-4 mb-4 last:pb-0 last:mb-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-left mb-3 group"
      >
        <h4 className="text-sm font-semibold text-[var(--charcoal)] group-hover:text-[var(--safety-orange)] transition-colors">
          {title}
        </h4>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && children}
    </div>
  );
}

export default function FilterPanel({
  filters,
  onChange,
  resultCount,
  totalCount,
  isMobileOpen,
  onMobileClose,
}: FilterPanelProps) {
  const update = (partial: Partial<CompanyFilterState>) => onChange({ ...filters, ...partial });

  const toggleInArray = <T,>(arr: T[], item: T): T[] =>
    arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];

  const activeFilterCount = [
    filters.companyTypes.length > 0,
    filters.specializations.length > 0,
    filters.priceRange.length > 0,
    filters.minRating > 0,
    filters.experienceRange.length > 0,
    filters.cities.length > 0,
    filters.license !== "all",
    filters.hasWebsite,
    filters.has2gis,
    filters.hideMinstroyBlacklistWarnings,
  ].filter(Boolean).length;

  const resetAll = () => onChange({ ...defaultCompanyFilters, searchQuery: filters.searchQuery, sortBy: filters.sortBy });

  const panelContent = (
    <>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <h3 className="font-heading text-lg font-semibold text-[var(--charcoal)]">Фильтры</h3>
          {activeFilterCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-[var(--steel-blue)] text-white text-xs flex items-center justify-center font-bold">
              {activeFilterCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {activeFilterCount > 0 && (
            <button type="button" onClick={resetAll} className="text-xs text-[var(--safety-orange)] hover:underline font-medium">
              Сбросить все
            </button>
          )}
          <button type="button" onClick={onMobileClose} className="lg:hidden p-1 text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <p className="text-xs text-[var(--slate-blue)] mb-4">
        Показано <span className="font-semibold text-[var(--charcoal)]">{resultCount}</span> из {totalCount}
      </p>

      <Section title="Сортировка">
        <select
          value={filters.sortBy}
          onChange={(e) => update({ sortBy: e.target.value as SortOption })}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white"
        >
          {sortOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </Section>

      <Section title="Тип компании">
        <div className="flex flex-wrap gap-2">
          {allCompanyTypes.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => update({ companyTypes: toggleInArray(filters.companyTypes, t) })}
              className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
                filters.companyTypes.includes(t)
                  ? "border-[var(--steel-blue)] bg-[var(--steel-blue)]/10 text-[var(--steel-blue)]"
                  : "border-gray-200 text-[var(--slate-blue)] hover:border-gray-300"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Специализация">
        <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
          {allSpecializations.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => update({ specializations: toggleInArray(filters.specializations, s) })}
              className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
                filters.specializations.includes(s)
                  ? "border-[var(--safety-orange)] bg-[var(--safety-orange)]/10 text-[var(--charcoal)]"
                  : "border-gray-200 text-[var(--slate-blue)] hover:border-gray-300"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Ценовой сегмент">
        <div className="space-y-2">
          {priceRanges.map((p) => (
            <label key={p.value} className="flex items-center gap-2 cursor-pointer text-sm">
              <input
                type="checkbox"
                checked={filters.priceRange.includes(p.value)}
                onChange={() => update({ priceRange: toggleInArray(filters.priceRange, p.value) })}
                className="rounded border-gray-300 text-[var(--steel-blue)]"
              />
              <span>
                {p.label} <span className="text-xs text-gray-400">({p.sub})</span>
              </span>
            </label>
          ))}
        </div>
      </Section>

      <Section title="Рейтинг">
        <div className="flex flex-wrap gap-2">
          {[0, 3, 4, 4.5].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => update({ minRating: r })}
              className={`text-xs px-3 py-1.5 rounded-lg border ${
                filters.minRating === r
                  ? "border-[var(--steel-blue)] bg-[var(--steel-blue)]/10"
                  : "border-gray-200"
              }`}
            >
              {r === 0 ? "Любой" : `${r}+ ★`}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Опыт (лет)" defaultOpen={false}>
        <div className="flex flex-wrap gap-2">
          {experienceRanges.map((e) => (
            <button
              key={e.value}
              type="button"
              onClick={() => update({ experienceRange: toggleInArray(filters.experienceRange, e.value) })}
              className={`text-xs px-2.5 py-1.5 rounded-lg border ${
                filters.experienceRange.includes(e.value)
                  ? "border-[var(--steel-blue)] bg-[var(--steel-blue)]/10"
                  : "border-gray-200 text-[var(--slate-blue)]"
              }`}
            >
              {e.label}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Город" defaultOpen={false}>
        <div className="flex flex-wrap gap-2">
          {cityOptions.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => update({ cities: toggleInArray(filters.cities, c) })}
              className={`text-xs px-2.5 py-1.5 rounded-lg border ${
                filters.cities.includes(c)
                  ? "border-[var(--steel-blue)] bg-[var(--steel-blue)]/10"
                  : "border-gray-200 text-[var(--slate-blue)]"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Лицензия" defaultOpen={false}>
        <div className="grid grid-cols-3 gap-1 p-1 bg-gray-100 rounded-lg">
          {(["all", "yes", "no"] as LicenseFilter[]).map((lic) => {
            const labels: Record<LicenseFilter, string> = { all: "Все", yes: "Есть", no: "Нет" };
            return (
              <button
                key={lic}
                type="button"
                onClick={() => update({ license: lic })}
                className={`text-xs py-2 rounded-md font-medium transition-colors ${
                  filters.license === lic ? "bg-white shadow text-[var(--charcoal)]" : "text-[var(--slate-blue)]"
                }`}
              >
                {labels[lic]}
              </button>
            );
          })}
        </div>
      </Section>

      <Section title="Дополнительно" defaultOpen={false}>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={filters.hasWebsite}
              onChange={(e) => update({ hasWebsite: e.target.checked })}
              className="rounded border-gray-300"
            />
            Есть сайт
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={filters.has2gis}
              onChange={(e) => update({ has2gis: e.target.checked })}
              className="rounded border-gray-300"
            />
            Есть 2ГИС
          </label>
          <label className="flex items-start gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={filters.hideMinstroyBlacklistWarnings}
              onChange={(e) => update({ hideMinstroyBlacklistWarnings: e.target.checked })}
              className="rounded border-gray-300 mt-0.5"
            />
            <span>
              Скрыть компании с предупреждением по чёрному списку
              <span className="block text-xs text-gray-400 mt-0.5">
                Только карточки с флагом автосопоставления с реестром Минстроя (ур. 6)
              </span>
            </span>
          </label>
        </div>
      </Section>
    </>
  );

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/40 z-40 lg:hidden transition-opacity ${
          isMobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onMobileClose}
        aria-hidden
      />
      <aside
        className={`
        lg:block lg:static lg:w-full
        fixed z-50 top-0 right-0 h-full w-[min(100%,320px)] bg-white shadow-xl lg:shadow-none
        border border-gray-100 rounded-xl p-5 overflow-y-auto
        transition-transform duration-300 lg:translate-x-0
        ${isMobileOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"}
      `}
      >
        {panelContent}
      </aside>
    </>
  );
}
