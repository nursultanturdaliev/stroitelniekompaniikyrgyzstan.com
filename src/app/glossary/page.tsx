import type { Metadata } from "next";
import Link from "next/link";
import { glossaryEntries } from "@/data/glossary";

export const metadata: Metadata = {
  title: "Паспорт объекта, ЖК и термины новостроек",
  description:
    "Словарь для покупателей жилья: что такое паспорт объекта Минстроя, дольщик, ЖК и др. Простой язык, не юридические определения.",
  openGraph: {
    title: "Словарь — новостройки и стройка KG",
    description: "Паспорт объекта, лицензия, дольщик, ЖК и другие термины простым языком.",
  },
};

function slugify(term: string): string {
  return term
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-zа-яё0-9-]/gi, "")
    .slice(0, 48);
}

export default function GlossaryPage() {
  return (
    <article className="section-padding bg-[var(--soft-white)] min-h-[60vh]">
      <div className="container-custom max-w-3xl">
        <h1 className="font-heading text-3xl md:text-4xl font-bold text-[var(--charcoal)] mb-3">Словарь</h1>
        <p className="text-[var(--slate-blue)] mb-4">
          Ориентиры для чтения каталога новостроек и переговоров с застройщиком. Формулировки не заменяют закон, договор и
          официальные сайты ведомств.
        </p>
        <p className="text-sm text-[var(--slate-blue)] mb-8">
          См. также{" "}
          <Link href="/methodology/" className="text-[var(--steel-blue)] font-medium hover:underline">
            как мы собираем данные
          </Link>
          ,{" "}
          <Link href="/projects/" className="text-[var(--steel-blue)] font-medium hover:underline">
            каталог объектов
          </Link>
          ,{" "}
          <Link href="/regions/" className="text-[var(--steel-blue)] font-medium hover:underline">
            регионы
          </Link>
          .
        </p>

        <nav className="mb-10 p-4 bg-white rounded-xl border border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">К разделам</p>
          <ul className="flex flex-wrap gap-2 text-sm">
            {glossaryEntries.map((e) => {
              const id = slugify(e.term);
              return (
                <li key={e.term}>
                  <a href={`#${id}`} className="text-[var(--steel-blue)] hover:underline">
                    {e.term}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="space-y-10">
          {glossaryEntries.map((e) => {
            const id = slugify(e.term);
            return (
              <section key={e.term} id={id} className="scroll-mt-24 bg-white rounded-xl border border-gray-100 p-5 md:p-6">
                <h2 className="font-heading text-xl font-semibold text-[var(--charcoal)] mb-2">{e.term}</h2>
                {e.aliases && e.aliases.length > 0 && (
                  <p className="text-xs text-gray-500 mb-3">Также: {e.aliases.join(", ")}</p>
                )}
                <p className="text-sm text-[var(--slate-blue)] leading-relaxed">{e.body}</p>
                {e.relatedHref && e.relatedLabel && (
                  <p className="mt-4 text-sm">
                    {e.relatedHref.startsWith("http") ? (
                      <a
                        href={e.relatedHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-[var(--steel-blue)] hover:underline"
                      >
                        {e.relatedLabel}
                      </a>
                    ) : (
                      <Link href={e.relatedHref} className="font-medium text-[var(--steel-blue)] hover:underline">
                        {e.relatedLabel}
                      </Link>
                    )}
                  </p>
                )}
              </section>
            );
          })}
        </div>

        <div className="mt-12 flex flex-wrap gap-3">
          <Link href="/projects/" className="btn-primary">
            Новостройки
          </Link>
          <Link href="/regions/" className="btn-secondary">
            Регионы
          </Link>
          <Link href="/guide/" className="btn-secondary">
            Практический гид
          </Link>
          <Link href="/verify/" className="btn-secondary">
            Проверка за 5 минут
          </Link>
        </div>
      </div>
    </article>
  );
}
