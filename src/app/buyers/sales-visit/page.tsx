import type { Metadata } from "next";
import Link from "next/link";
import SalesVisitPrintButton from "@/components/SalesVisitPrintButton";
import { salesOfficeChecklistKy, salesOfficeChecklistRu } from "@/data/salesOfficeChecklist";

export const metadata: Metadata = {
  title: "Чеклист визита в отдел продаж",
  description:
    "Вопросы и пункты перед встречей с застройщиком в КР. Русский и кыргызский текст. Не юридическая консультация.",
};

export default function SalesVisitPage() {
  return (
    <article className="section-padding bg-[var(--soft-white)] min-h-[60vh] print-checklist">
      <div className="container-custom max-w-4xl">
        <nav className="text-sm text-[var(--slate-blue)] mb-6 print-hidden">
          <Link href="/" className="hover:text-[var(--steel-blue)]">
            Главная
          </Link>
          <span className="mx-2">/</span>
          <span className="text-[var(--charcoal)]">Визит в офис</span>
        </nav>

        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="font-heading text-3xl md:text-4xl font-bold text-[var(--charcoal)] mb-2">
              Чеклист визита в отдел продаж
            </h1>
            <p className="text-sm text-[var(--slate-blue)] max-w-2xl">
              Возьмите распечатку или откройте на телефоне. Отметьте, что показали или обещали устно — и перенесите важное
              только в письменные документы. Не юридический совет.
            </p>
          </div>
          <SalesVisitPrintButton />
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <section className="bg-white rounded-xl border border-gray-100 p-5 md:p-6">
            <h2 className="font-heading text-lg font-semibold text-[var(--charcoal)] mb-4">На русском</h2>
            <ol className="list-decimal pl-5 space-y-3 text-sm text-[var(--slate-blue)]">
              {salesOfficeChecklistRu.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ol>
          </section>
          <section className="bg-white rounded-xl border border-gray-100 p-5 md:p-6">
            <h2 className="font-heading text-lg font-semibold text-[var(--charcoal)] mb-4">Кыргызча</h2>
            <ol className="list-decimal pl-5 space-y-3 text-sm text-[var(--slate-blue)]">
              {salesOfficeChecklistKy.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ol>
          </section>
        </div>

        <div className="mt-10 flex flex-wrap gap-3 print-hidden">
          <Link href="/guide/#price-currency" className="btn-secondary">
            Цена в каталоге и в договоре
          </Link>
          <Link href="/verify/" className="btn-primary">
            Проверка за 5 минут
          </Link>
          <Link href="/buyers/first-apartment/" className="btn-secondary">
            Сценарий «первая квартира»
          </Link>
        </div>
      </div>
    </article>
  );
}
