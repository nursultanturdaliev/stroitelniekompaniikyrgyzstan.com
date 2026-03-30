import type { Metadata } from "next";
import Link from "next/link";
import CompanyCard from "@/components/CompanyCard";
import { companies } from "@/data/companies";
import { registryBlacklistSection, registryGuideDisclaimer } from "@/data/registryGuide";

export const metadata: Metadata = {
  title: "Чёрный список реестра Минстроя",
  description:
    "Компании каталога с предупреждением о совпадении с чёрным списком реестра Минстроя (уровень 6): что это значит и как проверить на официальном сайте.",
};

function blacklistedCatalogCompanies() {
  return companies
    .filter((c) => c.minstroyBlacklistWarning)
    .sort((a, b) => a.name.localeCompare(b.name, "ru"));
}

export default function BlacklistPage() {
  const section = registryBlacklistSection;
  const listed = blacklistedCatalogCompanies();

  return (
    <article className="section-padding bg-[var(--soft-white)]">
      <div className="container-custom">
        <div className="max-w-3xl">
          <nav className="text-sm text-[var(--slate-blue)] mb-6">
            <Link href="/" className="hover:text-[var(--safety-orange)]">
              Главная
            </Link>
            <span className="mx-2 text-gray-300">/</span>
            <span className="text-[var(--charcoal)]">Чёрный список</span>
          </nav>

          <h1 className="font-heading text-3xl md:text-4xl font-bold text-[var(--charcoal)] mb-4">{section.title}</h1>
          <p className="text-[var(--slate-blue)] mb-8">
            Справка по реестру нарушений (уровень 6) и компании каталога, у которых при сборе данных сработало автоматическое
            сопоставление с этим разделом. Не юридическая консультация.
          </p>

          <div className="p-6 bg-amber-50/80 rounded-xl border border-amber-100 mb-10">
            <h2 className="font-heading text-lg font-semibold text-[var(--charcoal)] mb-2">{registryGuideDisclaimer.title}</h2>
            <p className="text-sm text-[var(--slate-blue)] mb-4">{registryGuideDisclaimer.body}</p>
            <a
              href={registryGuideDisclaimer.officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-[var(--steel-blue)] underline"
            >
              Официальный сайт Минстроя
            </a>
          </div>
        </div>

        <section className="mb-12" aria-labelledby="blacklist-catalog-heading">
          <h2 id="blacklist-catalog-heading" className="font-heading text-2xl font-bold text-[var(--charcoal)] mb-2">
            Компании в каталоге с предупреждением
          </h2>
          <p className="text-sm text-[var(--slate-blue)] mb-6 max-w-3xl">
            Ниже — карточки из нашего каталога, где включён флаг совпадения с чёрным списком реестра по названию (и при наличии —
            по ИНН). Это не означает, что компания «в списке Минстроя» в юридическом смысле: статус проверяйте только на{" "}
            <a
              href={section.ctaHref}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--steel-blue)] font-medium underline"
            >
              официальной странице реестра
            </a>
            .
          </p>
          {listed.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-[var(--slate-blue)]">
              <p className="mb-3">
                В текущей выгрузке каталога нет компаний с таким предупреждением — либо совпадений не найдено, либо данные ещё не
                обновлялись.
              </p>
              <p className="text-sm">
                Полный перечень решений комиссии смотрите на сайте Минстроя:{" "}
                <a
                  href={section.ctaHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--steel-blue)] font-medium underline"
                >
                  реестр, раздел 6
                </a>
                . В общем{" "}
                <Link href="/companies/" className="text-[var(--steel-blue)] font-medium underline">
                  каталоге
                </Link>{" "}
                можно включить фильтр «Скрыть предупреждения чёрного списка», чтобы не показывать такие карточки в выдаче.
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm font-medium text-[var(--charcoal)] mb-4">
                Найдено в каталоге:{" "}
                <span className="text-[var(--steel-blue)]">{listed.length}</span>
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {listed.map((company) => (
                  <CompanyCard key={company.id} company={company} />
                ))}
              </div>
            </>
          )}
        </section>

        <div className="max-w-3xl">
          <section className="bg-white rounded-xl border border-gray-100 p-6 mb-10">
            <h2 className="font-heading text-xl font-semibold text-[var(--charcoal)] mb-4">Как это устроено</h2>
            <div className="text-[var(--slate-blue)] space-y-3 mb-4">
              {section.paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Актуальность и толкование — только на официальном сайте Министерства строительства КР.
            </p>
            <a
              href={section.ctaHref}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-[var(--steel-blue)] hover:underline"
            >
              {section.ctaLabel}
            </a>
          </section>

          <div className="flex flex-wrap gap-4">
            <Link href="/companies/" className="btn-primary">
              Каталог компаний
            </Link>
            <Link href="/guide/" className="btn-secondary">
              Гид по выбору подрядчика
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
