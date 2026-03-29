import Link from "next/link";
import type { ConstructionCompany } from "@/types/company";
import PriceRangeTag from "./PriceRangeTag";

interface CompanyCardProps {
  company: ConstructionCompany;
  featured?: boolean;
}

export default function CompanyCard({ company, featured }: CompanyCardProps) {
  return (
    <Link
      href={`/companies/${company.slug}/`}
      className={`group bg-white rounded-xl overflow-hidden border border-gray-100 hover:border-[var(--steel-blue)]/30 hover:shadow-xl transition-all duration-300 flex flex-col ${
        featured ? "md:col-span-2 md:flex-row" : ""
      }`}
    >
      <div
        className={`relative bg-[var(--warm-beige)] ${featured ? "md:w-2/5" : ""} h-48 ${featured ? "md:h-auto" : ""} flex items-center justify-center`}
      >
        <div className="w-20 h-20 rounded-lg bg-[var(--steel-blue)]/10 flex items-center justify-center">
          <span className="text-3xl font-heading font-bold text-[var(--steel-blue)]">{company.name.charAt(0)}</span>
        </div>
        <div className="absolute top-3 right-3 flex flex-col gap-1 items-end">
          <PriceRangeTag priceRange={company.priceRange} />
          {company.hasLicense && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--forest-green)]/15 text-[var(--forest-green)] font-medium">
              Лицензия
            </span>
          )}
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <h3 className="font-heading text-xl font-semibold text-[var(--charcoal)] group-hover:text-[var(--steel-blue)] transition-colors">
              {company.name}
            </h3>
            <p className="text-sm text-[var(--slate-blue)]">{company.type.slice(0, 2).join(" · ")}</p>
          </div>
          {company.rating && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <svg className="w-4 h-4 text-[var(--safety-orange)]" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-sm font-semibold text-[var(--charcoal)]">{company.rating}</span>
              {company.reviewCount && (
                <span className="text-xs text-[var(--slate-blue)]">({company.reviewCount})</span>
              )}
            </div>
          )}
        </div>

        <p className="text-sm text-[var(--slate-blue)] mb-3 line-clamp-2">{company.tagline}</p>

        <div className="flex flex-wrap gap-1.5 mb-3">
          {company.specializations.slice(0, 3).map((s) => (
            <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-[var(--warm-beige)] text-[var(--slate-blue)]">
              {s}
            </span>
          ))}
        </div>

        <div className="mt-auto flex items-center justify-between pt-3 border-t border-gray-50 flex-wrap gap-2">
          <div className="flex items-center gap-3 text-xs text-[var(--slate-blue)]">
            <span>{company.experience} лет опыта</span>
            {company.projectCount && (
              <>
                <span className="w-1 h-1 rounded-full bg-gray-300" />
                <span>{company.projectCount} проектов</span>
              </>
            )}
          </div>
          <span className="text-xs text-[var(--slate-blue)]">{company.location.city}</span>
        </div>
        {company.priceNote && (
          <p className="text-xs font-medium text-[var(--safety-orange)] mt-2">{company.priceNote}</p>
        )}
      </div>
    </Link>
  );
}
