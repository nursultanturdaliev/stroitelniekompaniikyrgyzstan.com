import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { constructionTypes, getConstructionTypeBySlug } from "@/data/constructionTypes";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return constructionTypes.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const t = getConstructionTypeBySlug(slug);
  if (!t) return { title: "Не найдено" };
  return {
    title: t.name,
    description: t.summary,
  };
}

export default async function TypeDetailPage({ params }: Props) {
  const { slug } = await params;
  const t = getConstructionTypeBySlug(slug);
  if (!t) notFound();

  return (
    <article className="section-padding bg-[var(--soft-white)]">
      <div className="container-custom max-w-3xl">
        <nav className="text-sm text-[var(--slate-blue)] mb-6">
          <Link href="/types/" className="hover:text-[var(--steel-blue)]">
            Типы работ
          </Link>
          <span className="mx-2">/</span>
          <span className="text-[var(--charcoal)]">{t.name}</span>
        </nav>
        <h1 className="font-heading text-3xl md:text-4xl font-bold text-[var(--charcoal)] mb-2">{t.name}</h1>
        <p className="text-[var(--slate-blue)] mb-6">{t.summary}</p>
        <div className="prose prose-lg max-w-none text-[var(--slate-blue)] whitespace-pre-line mb-8">{t.description}</div>

        <div className="bg-white rounded-xl p-6 border border-gray-100 mb-6">
          <h2 className="font-heading text-xl font-semibold text-[var(--charcoal)] mb-3">Типовые работы</h2>
          <ul className="list-disc pl-5 text-[var(--slate-blue)] space-y-1">
            {t.typicalWorks.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100 mb-6">
          <h2 className="font-heading text-xl font-semibold text-[var(--charcoal)] mb-3">Спросите у подрядчика</h2>
          <ul className="list-disc pl-5 text-[var(--slate-blue)] space-y-1">
            {t.questionsToAsk.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ul>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100 mb-6">
          <h2 className="font-heading text-xl font-semibold text-[var(--charcoal)] mb-3">Ориентир по ценам</h2>
          <p className="text-[var(--slate-blue)]">{t.priceRange}</p>
        </div>

        <div className="bg-amber-50 rounded-xl p-6 border border-amber-100 mb-8">
          <h2 className="font-heading text-xl font-semibold text-[var(--charcoal)] mb-3">Риски</h2>
          <ul className="list-disc pl-5 text-[var(--slate-blue)] space-y-1">
            {t.risks.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>

        <Link href="/companies/" className="btn-primary inline-block">
          Смотреть компании
        </Link>
      </div>
    </article>
  );
}
