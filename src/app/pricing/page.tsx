import type { Metadata } from "next";
import Link from "next/link";
import { pricingTiers } from "@/data/practicalInfo";

export const metadata: Metadata = {
  title: "Ориентиры по ценам",
  description: "Сегменты бюджета для ремонта и строительства в Кыргызстане — справочно, не оферта.",
};

export default function PricingPage() {
  return (
    <article className="section-padding bg-[var(--soft-white)]">
      <div className="container-custom max-w-3xl">
        <h1 className="font-heading text-3xl md:text-4xl font-bold text-[var(--charcoal)] mb-4">Ориентиры по ценам</h1>
        <p className="text-[var(--slate-blue)] mb-8">
          Цены на рынке меняются. Ниже — упрощённая сетка для сравнения предложений. Всегда запрашивайте детальную смету.
        </p>

        <div className="space-y-4">
          {pricingTiers.map((p) => (
            <div key={p.tier} className="bg-white rounded-xl p-6 border border-gray-100">
              <h2 className="font-heading text-xl font-semibold text-[var(--charcoal)] mb-1">{p.title}</h2>
              <p className="text-sm font-medium text-[var(--steel-blue)] mb-2">{p.range}</p>
              <p className="text-[var(--slate-blue)] text-sm">{p.description}</p>
            </div>
          ))}
        </div>

        <p className="mt-8 text-sm text-[var(--slate-blue)]">
          Используйте{" "}
          <Link href="/negotiator/" className="text-[var(--steel-blue)] font-medium hover:underline">
            AI-переговорщика
          </Link>
          , чтобы подготовить вопросы о скидках, этапах оплаты и фиксации цены в договоре.
        </p>
      </div>
    </article>
  );
}
