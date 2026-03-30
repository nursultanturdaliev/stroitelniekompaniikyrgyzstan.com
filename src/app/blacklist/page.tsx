import type { Metadata } from "next";
import Link from "next/link";
import { registryBlacklistSection, registryGuideDisclaimer } from "@/data/registryGuide";

export const metadata: Metadata = {
  title: "Чёрный список реестра Минстроя",
  description:
    "Что такое уровень 6 / чёрный список в открытых данных Минстроя КР, как мы показываем предупреждения в каталоге и где проверить актуальность на официальном сайте.",
};

export default function BlacklistPage() {
  const section = registryBlacklistSection;

  return (
    <article className="section-padding bg-[var(--soft-white)]">
      <div className="container-custom max-w-3xl">
        <nav className="text-sm text-[var(--slate-blue)] mb-6">
          <Link href="/" className="hover:text-[var(--safety-orange)]">
            Главная
          </Link>
          <span className="mx-2 text-gray-300">/</span>
          <span className="text-[var(--charcoal)]">Чёрный список</span>
        </nav>

        <h1 className="font-heading text-3xl md:text-4xl font-bold text-[var(--charcoal)] mb-4">{section.title}</h1>
        <p className="text-[var(--slate-blue)] mb-8">
          Справка по реестру нарушений (уровень 6) и тому, как это отражается в нашем каталоге. Не юридическая консультация.
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

        <section className="bg-white rounded-xl border border-gray-100 p-6 mb-10">
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
    </article>
  );
}
