import Link from "next/link";
import type { ConstructionCompany } from "@/types/company";

export default function ProjectBuilderTrustStrip({ company }: { company: ConstructionCompany }) {
  return (
    <section className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
      <h2 className="font-heading text-lg font-semibold text-[var(--charcoal)] mb-3">Застройщик</h2>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <Link
          href={`/companies/${company.slug}/`}
          className="text-base font-semibold text-[var(--steel-blue)] hover:underline"
        >
          {company.name}
        </Link>
        {company.hasLicense && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-100">
            Лицензия (по данным реестра в каталоге)
          </span>
        )}
        {!company.hasLicense && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
            Лицензия не отмечена в карточке
          </span>
        )}
        {company.minstroyBlacklistWarning && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200">
            Есть совпадение с чёрным списком реестра (автоматически; проверьте сами)
          </span>
        )}
      </div>
      <p className="text-sm text-[var(--slate-blue)]">
        Проверьте реестры на{" "}
        <a
          href="https://minstroy.gov.kg"
          className="text-[var(--steel-blue)] underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          minstroy.gov.kg
        </a>
        . Как пользоваться реестрами — в{" "}
        <Link href="/guide/" className="text-[var(--steel-blue)] font-medium hover:underline">
          практическом гиде
        </Link>
        .
      </p>
    </section>
  );
}
