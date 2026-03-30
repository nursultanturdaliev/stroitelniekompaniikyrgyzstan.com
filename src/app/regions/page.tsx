import type { Metadata } from "next";
import Link from "next/link";
import { regionalNotes } from "@/data/regionalNotes";

const siteUrl = "https://stroitelniekompaniikyrgyzstan.com";

const regionsDescription =
  "Новостройки Бишкек и других городов: как читать каталог, фильтры elitka и проверка паспорта объекта. Не юридическая консультация. Ссылки на verify, гид и словарь.";

export const metadata: Metadata = {
  title: "Новостройки Бишкек, Ош и регионы — ориентиры",
  description: regionsDescription,
  openGraph: {
    title: "Регионы — новостройки Кыргызстана",
    description: regionsDescription,
    url: `${siteUrl}/regions/`,
    type: "website",
  },
};

export default function RegionsPage() {
  return (
    <article className="section-padding bg-[var(--soft-white)] min-h-[60vh]">
      <div className="container-custom max-w-3xl">
        <h1 className="font-heading text-3xl md:text-4xl font-bold text-[var(--charcoal)] mb-3">Регионы</h1>
        <p className="text-[var(--slate-blue)] mb-4">
          Практические ориентиры для чтения каталога новостроек (в т.ч. Бишкек и Ош). Условия рынка и юридические нюансы
          уточняйте у профильных специалистов и по официальным сайтам ведомств.
        </p>
        <p className="text-sm text-[var(--slate-blue)] mb-8">
          Связанные разделы:{" "}
          <Link href="/projects/" className="text-[var(--steel-blue)] font-medium hover:underline">
            каталог объектов
          </Link>
          ,{" "}
          <Link href="/buyers/location-environment/" className="text-[var(--steel-blue)] font-medium hover:underline">
            место и среда (география, воздух, быт)
          </Link>
          ,{" "}
          <Link href="/glossary/" className="text-[var(--steel-blue)] font-medium hover:underline">
            словарь
          </Link>
          ,{" "}
          <Link href="/methodology/" className="text-[var(--steel-blue)] font-medium hover:underline">
            как собираются данные
          </Link>
          .
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
              {(r.geography || r.airAndClimate || r.mobilityNoiseLife) && (
                <div className="mb-4 space-y-3 text-sm text-[var(--slate-blue)] border-l-2 border-[var(--steel-blue)]/25 pl-4">
                  {r.geography && (
                    <p>
                      <span className="font-medium text-[var(--charcoal)]">География и рельеф: </span>
                      {r.geography}
                    </p>
                  )}
                  {r.airAndClimate && (
                    <p>
                      <span className="font-medium text-[var(--charcoal)]">Климат и воздух: </span>
                      {r.airAndClimate}
                    </p>
                  )}
                  {r.mobilityNoiseLife && (
                    <p>
                      <span className="font-medium text-[var(--charcoal)]">Транспорт, шум, быт: </span>
                      {r.mobilityNoiseLife}
                    </p>
                  )}
                </div>
              )}
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
          <Link href="/methodology/" className="btn-secondary">
            Методология
          </Link>
          <Link href="/buyers/location-environment/" className="btn-secondary">
            Место и среда
          </Link>
        </div>
      </div>
    </article>
  );
}
