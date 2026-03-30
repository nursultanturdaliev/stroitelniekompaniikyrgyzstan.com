import type { Metadata } from "next";
import Link from "next/link";
import { regionalNotes } from "@/data/regionalNotes";

export const metadata: Metadata = {
  title: "Регионы: новостройки и проверка",
  description:
    "Краткие заметки по Бишкеку, Ошу и регионам для покупателей жилья. Ориентиры, не юридическая консультация.",
  openGraph: {
    title: "Регионы — каталог новостроек КР",
    description: "Как пользоваться фильтрами и официальными источниками в разных городах.",
  },
};

export default function RegionsPage() {
  return (
    <article className="section-padding bg-[var(--soft-white)] min-h-[60vh]">
      <div className="container-custom max-w-3xl">
        <h1 className="font-heading text-3xl md:text-4xl font-bold text-[var(--charcoal)] mb-3">Регионы</h1>
        <p className="text-[var(--slate-blue)] mb-8">
          Практические ориентиры для чтения каталога. Условия рынка и юридические нюансы уточняйте у профильных специалистов и по
          официальным сайтам ведомств.
        </p>

        <nav className="mb-10 p-4 bg-white rounded-xl border border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Разделы</p>
          <ul className="flex flex-wrap gap-2 text-sm">
            {regionalNotes.map((r) => (
              <li key={r.id}>
                <a href={`#${r.id}`} className="text-[var(--steel-blue)] hover:underline">
                  {r.name}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-10">
          {regionalNotes.map((r) => (
            <section key={r.id} id={r.id} className="scroll-mt-24 bg-white rounded-xl border border-gray-100 p-5 md:p-6">
              <h2 className="font-heading text-xl font-semibold text-[var(--charcoal)] mb-2">{r.name}</h2>
              {r.elitkaCityId != null && (
                <p className="text-xs text-gray-500 mb-3">В фильтрах каталога: city_id = {r.elitkaCityId} (elitka.kg)</p>
              )}
              <p className="text-sm text-[var(--slate-blue)] mb-4">{r.intro}</p>
              <ul className="list-disc pl-5 text-sm text-[var(--slate-blue)] space-y-2">
                {r.bullets.map((b, i) => (
                  <li key={`${r.id}-${i}`}>{b}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap gap-3">
          <Link href="/projects/" className="btn-primary">
            Каталог новостроек
          </Link>
          <Link href="/projects/map/" className="btn-secondary">
            Карта
          </Link>
          <Link href="/verify/" className="btn-secondary">
            Проверка за 5 минут
          </Link>
          <Link href="/guide/" className="btn-secondary">
            Гид
          </Link>
        </div>
      </div>
    </article>
  );
}
