"use client";

import { useState, useMemo, useCallback } from "react";
import CompanyCard from "@/components/CompanyCard";
import CompanyCardList from "@/components/CompanyCardList";
import FilterPanel, {
  type CompanyFilterState,
  type SortOption,
  defaultCompanyFilters,
} from "@/components/FilterPanel";
import ActiveFilterTags from "@/components/ActiveFilterTags";
import { companies, type ConstructionCompany } from "@/data/companies";

const priceOrder: Record<string, number> = { budget: 1, mid: 2, premium: 3, luxury: 4 };

function matchExperience(experience: number, ranges: string[]): boolean {
  if (ranges.length === 0) return true;
  return ranges.some((r) => {
    if (r === "1-3") return experience >= 1 && experience <= 3;
    if (r === "4-7") return experience >= 4 && experience <= 7;
    if (r === "8-15") return experience >= 8 && experience <= 15;
    if (r === "16+") return experience >= 16;
    return false;
  });
}

function companyMatchesCity(c: ConstructionCompany, cities: string[]): boolean {
  if (cities.length === 0) return true;
  return cities.some(
    (city) =>
      c.location.city.toLowerCase().includes(city.toLowerCase()) ||
      c.workArea.some((w) => w.toLowerCase().includes(city.toLowerCase())),
  );
}

function sortCompanies(list: ConstructionCompany[], sortBy: SortOption): ConstructionCompany[] {
  const sorted = [...list];
  switch (sortBy) {
    case "rating":
      return sorted.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    case "reviews":
      return sorted.sort((a, b) => (b.reviewCount ?? 0) - (a.reviewCount ?? 0));
    case "experience":
      return sorted.sort((a, b) => b.experience - a.experience);
    case "projects":
      return sorted.sort((a, b) => (b.projectCount ?? 0) - (a.projectCount ?? 0));
    case "price-asc":
      return sorted.sort((a, b) => (priceOrder[a.priceRange] ?? 0) - (priceOrder[b.priceRange] ?? 0));
    case "price-desc":
      return sorted.sort((a, b) => (priceOrder[b.priceRange] ?? 0) - (priceOrder[a.priceRange] ?? 0));
    case "name":
      return sorted.sort((a, b) => a.name.localeCompare(b.name, "ru"));
    default:
      return sorted;
  }
}

const sortLabels: Record<SortOption, string> = {
  rating: "По рейтингу",
  reviews: "По отзывам",
  experience: "По опыту",
  projects: "По проектам",
  "price-asc": "Цена ↑",
  "price-desc": "Цена ↓",
  name: "А → Я",
};

function initialSearchQuery(): string {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("q") ?? "";
}

export default function CompaniesCatalog() {
  const [filters, setFilters] = useState<CompanyFilterState>(() => ({
    ...defaultCompanyFilters,
    searchQuery: initialSearchQuery(),
  }));
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  const updateFilters = useCallback((newFilters: CompanyFilterState) => setFilters(newFilters), []);

  const filteredCompanies = useMemo(() => {
    const filtered = companies.filter((c) => {
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        const searchable = `${c.name} ${c.tagline} ${c.services.join(" ")} ${c.specializations.join(" ")} ${c.type.join(" ")} ${c.location.address || ""} ${c.location.city}`.toLowerCase();
        if (!searchable.includes(q)) return false;
      }

      if (filters.companyTypes.length > 0 && !c.type.some((t) => filters.companyTypes.includes(t))) return false;

      if (filters.specializations.length > 0 && !c.specializations.some((s) => filters.specializations.includes(s))) {
        return false;
      }

      if (filters.minRating > 0 && (c.rating ?? 0) < filters.minRating) return false;

      if (filters.priceRange.length > 0 && !filters.priceRange.includes(c.priceRange)) return false;

      if (!matchExperience(c.experience, filters.experienceRange)) return false;

      if (!companyMatchesCity(c, filters.cities)) return false;

      if (filters.license === "yes" && !c.hasLicense) return false;
      if (filters.license === "no" && c.hasLicense) return false;

      if (filters.hasWebsite && !c.contacts.website) return false;
      if (filters.has2gis && !c.contacts.twogisUrl) return false;

      return true;
    });

    return sortCompanies(filtered, filters.sortBy);
  }, [filters]);

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
  ].filter(Boolean).length;

  const stats = useMemo(() => {
    const licensed = companies.filter((c) => c.hasLicense).length;
    return { total: companies.length, licensed };
  }, []);

  return (
    <>
      <section className="bg-[var(--deep-navy)] py-12 sm:py-16">
        <div className="container-custom">
          <h1 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3">
            Застройщики, подрядчики и агентства Кыргызстана
          </h1>
          <p className="text-white/60 max-w-2xl text-sm sm:text-base mb-6">
            {stats.total} компаний в каталоге (в т.ч. риелторы с house.kg и застройщики с elitka.kg). {stats.licensed} с
            отметкой о лицензии по данным карточек. Фильтр по типу помогает отделить агентства недвижимости от
            строительных организаций.
          </p>
          <div className="max-w-lg">
            <div className="relative">
              <svg
                className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="search"
                value={filters.searchQuery}
                onChange={(e) => updateFilters({ ...filters, searchQuery: e.target.value })}
                placeholder="Поиск по названию, услуге, городу..."
                className="w-full pl-11 pr-4 py-3.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[var(--safety-orange)] focus:bg-white/15 transition-all"
              />
              {filters.searchQuery && (
                <button
                  type="button"
                  onClick={() => updateFilters({ ...filters, searchQuery: "" })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                  aria-label="Очистить поиск"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding bg-[var(--soft-white)]">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 lg:gap-8">
            <div className="lg:col-span-1">
              <FilterPanel
                filters={filters}
                onChange={updateFilters}
                resultCount={filteredCompanies.length}
                totalCount={companies.length}
                isMobileOpen={mobileFiltersOpen}
                onMobileClose={() => setMobileFiltersOpen(false)}
              />
            </div>

            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setMobileFiltersOpen(true)}
                    className="lg:hidden flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-[var(--charcoal)] hover:border-[var(--steel-blue)] transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                      />
                    </svg>
                    Фильтры
                    {activeFilterCount > 0 && (
                      <span className="w-5 h-5 rounded-full bg-[var(--steel-blue)] text-white text-xs flex items-center justify-center font-bold">
                        {activeFilterCount}
                      </span>
                    )}
                  </button>

                  <p className="text-sm text-[var(--slate-blue)]">
                    <span className="font-semibold text-[var(--charcoal)]">{filteredCompanies.length}</span> из{" "}
                    {companies.length} компаний
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setSortOpen(!sortOpen)}
                      className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                    >
                      {sortLabels[filters.sortBy]}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {sortOpen && (
                      <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1">
                        {(Object.keys(sortLabels) as SortOption[]).map((key) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => {
                              updateFilters({ ...filters, sortBy: key });
                              setSortOpen(false);
                            }}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                          >
                            {sortLabels[key]}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setViewMode("grid")}
                      className={`p-2 ${viewMode === "grid" ? "bg-[var(--steel-blue)] text-white" : "bg-white text-gray-600"}`}
                      aria-label="Сетка"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M3 3h6v6H3V3zm8 0h6v6h-6V3zM3 11h6v6H3v-6zm8 0h6v6h-6v-6z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode("list")}
                      className={`p-2 ${viewMode === "list" ? "bg-[var(--steel-blue)] text-white" : "bg-white text-gray-600"}`}
                      aria-label="Список"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M3 4h14v2H3V4zm0 5h14v2H3V9zm0 5h14v2H3v-2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <ActiveFilterTags filters={filters} onChange={updateFilters} />
              </div>

              {filteredCompanies.length === 0 ? (
                <p className="text-[var(--slate-blue)] py-12 text-center">Ничего не найдено. Сбросьте фильтры или измените запрос.</p>
              ) : viewMode === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredCompanies.map((company, index) => (
                    <CompanyCard key={company.id} company={company} featured={index === 0 && filteredCompanies.length > 2} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {filteredCompanies.map((company) => (
                    <CompanyCardList key={company.id} company={company} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
