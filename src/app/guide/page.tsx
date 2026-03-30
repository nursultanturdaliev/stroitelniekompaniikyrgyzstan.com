import type { Metadata } from "next";
import Link from "next/link";
import { processSteps } from "@/data/practicalInfo";
import { registryGuideDisclaimer, registryGuideSections } from "@/data/registryGuide";

export const metadata: Metadata = {
  title: "Как выбрать подрядчика",
  description: "Пошаговый гид: ТЗ, сравнение смет, проверка документов и приёмка работ в Кыргызстане.",
};

export default function GuidePage() {
  return (
    <article className="section-padding bg-[var(--soft-white)]">
      <div className="container-custom max-w-3xl">
        <h1 className="font-heading text-3xl md:text-4xl font-bold text-[var(--charcoal)] mb-4">
          Как выбрать строительную компанию
        </h1>
        <p className="text-[var(--slate-blue)] mb-10">
          Независимый чек-лист: без рекламы конкретных брендов, с акцентом на прозрачность договора и документы.
        </p>

        <ol className="space-y-8">
          {processSteps.map((s) => (
            <li key={s.step} className="flex gap-4">
              <span className="flex-shrink-0 w-10 h-10 rounded-full bg-[var(--steel-blue)] text-white font-heading font-bold flex items-center justify-center">
                {s.step}
              </span>
              <div>
                <h2 className="font-heading text-xl font-semibold text-[var(--charcoal)] mb-2">{s.title}</h2>
                <p className="text-[var(--slate-blue)]">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-12 p-6 bg-white rounded-xl border border-gray-100">
          <h2 className="font-heading text-xl font-semibold text-[var(--charcoal)] mb-3">Дополнительно</h2>
          <ul className="list-disc pl-5 text-[var(--slate-blue)] space-y-2">
            <li>Сравнивайте не только цену за м², но и состав работ и бренды материалов.</li>
            <li>Запрашивайте акты скрытых работ и фотоотчёты по этапам.</li>
            <li>Для крупных сумм консультируйтесь с юристом по договору подряда.</li>
          </ul>
        </div>

        <div className="mt-12 p-6 bg-amber-50/80 rounded-xl border border-amber-100">
          <h2 className="font-heading text-xl font-semibold text-[var(--charcoal)] mb-2">{registryGuideDisclaimer.title}</h2>
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

        <div className="mt-10 space-y-10">
          <h2 className="font-heading text-2xl font-bold text-[var(--charcoal)]">Реестры и типы компаний</h2>
          {registryGuideSections.map((section) => (
            <section key={section.id} id={section.id} className="bg-white rounded-xl border border-gray-100 p-6 scroll-mt-24">
              <h3 className="font-heading text-lg font-semibold text-[var(--charcoal)] mb-3">{section.title}</h3>
              <div className="text-sm text-[var(--slate-blue)] space-y-3 mb-4">
                {section.paragraphs.map((p, i) => (
                  <p key={`${section.id}-${i}`}>{p}</p>
                ))}
              </div>
              <p className="text-xs text-gray-500 mb-3">
                Актуальность и толкование — только на официальном сайте Министерства строительства КР.
              </p>
              {section.ctaHref.startsWith("http") ? (
                <a
                  href={section.ctaHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-[var(--steel-blue)] hover:underline"
                >
                  {section.ctaLabel}
                </a>
              ) : (
                <Link href={section.ctaHref} className="text-sm font-medium text-[var(--steel-blue)] hover:underline">
                  {section.ctaLabel}
                </Link>
              )}
            </section>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-4">
          <Link href="/regions/" className="btn-secondary">
            Регионы
          </Link>
          <Link href="/verify/" className="btn-primary">
            Проверка за 5 минут
          </Link>
          <Link href="/projects/" className="btn-secondary">
            Каталог новостроек
          </Link>
          <Link href="/companies/" className="btn-secondary">
            Каталог компаний
          </Link>
          <Link href="/glossary/" className="btn-secondary">
            Словарь терминов
          </Link>
          <Link href="/faq/" className="btn-secondary">
            Частые вопросы
          </Link>
          <Link href="/negotiator/" className="btn-secondary">
            AI-переговорщик
          </Link>
        </div>
      </div>
    </article>
  );
}
