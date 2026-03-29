import Link from "next/link";
import type { ConstructionCompany } from "@/types/company";
import PriceRangeTag from "./PriceRangeTag";

export default function CompanyCardList({ company }: { company: ConstructionCompany }) {
  return (
    <Link
      href={`/companies/${company.slug}/`}
      className="group bg-white rounded-xl overflow-hidden border border-gray-100 hover:border-[var(--steel-blue)]/30 hover:shadow-lg transition-all duration-300 flex"
    >
      <div className="w-20 sm:w-28 flex-shrink-0 bg-[var(--warm-beige)] flex items-center justify-center">
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-[var(--steel-blue)]/10 flex items-center justify-center">
          <span className="text-xl sm:text-2xl font-heading font-bold text-[var(--steel-blue)]">
            {company.name.charAt(0)}
          </span>
        </div>
      </div>

      <div className="flex-1 p-3 sm:p-4 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-heading text-base sm:text-lg font-semibold text-[var(--charcoal)] group-hover:text-[var(--steel-blue)] transition-colors truncate">
                {company.name}
              </h3>
              <PriceRangeTag priceRange={company.priceRange} />
              {company.hasLicense && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--forest-green)]/15 text-[var(--forest-green)]">
                  Лицензия
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--slate-blue)] truncate">{company.type.join(", ")}</p>
          </div>
          {company.rating && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <svg className="w-4 h-4 text-[var(--safety-orange)]" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-sm font-semibold text-[var(--charcoal)]">{company.rating}</span>
            </div>
          )}
        </div>

        <p className="text-xs sm:text-sm text-[var(--slate-blue)] mb-2 line-clamp-1">{company.tagline}</p>

        <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--slate-blue)]">
          <span>{company.location.city}</span>
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {company.experience} лет
          </span>
          {company.projectCount && (
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
              {company.projectCount} проектов
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
