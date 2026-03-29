import type { Metadata } from "next";
import Link from "next/link";
import { processSteps } from "@/data/practicalInfo";

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

        <div className="mt-8 flex flex-wrap gap-4">
          <Link href="/companies/" className="btn-primary">
            Каталог компаний
          </Link>
          <Link href="/negotiator/" className="btn-secondary">
            AI-переговорщик
          </Link>
        </div>
      </div>
    </article>
  );
}
