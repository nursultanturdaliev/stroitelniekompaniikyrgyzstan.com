import type { Metadata } from "next";
import { faqItems } from "@/data/practicalInfo";

export const metadata: Metadata = {
  title: "Частые вопросы",
  description: "Ответы о каталоге строительных компаний Кыргызстана, данных и AI-переговорщике.",
};

export default function FaqPage() {
  return (
    <article className="section-padding bg-[var(--soft-white)]">
      <div className="container-custom max-w-3xl">
        <h1 className="font-heading text-3xl md:text-4xl font-bold text-[var(--charcoal)] mb-8">Частые вопросы</h1>
        <div className="space-y-6">
          {faqItems.map((item) => (
            <div key={item.q} className="bg-white rounded-xl p-6 border border-gray-100">
              <h2 className="font-heading text-lg font-semibold text-[var(--charcoal)] mb-2">{item.q}</h2>
              <p className="text-[var(--slate-blue)] text-sm leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}
