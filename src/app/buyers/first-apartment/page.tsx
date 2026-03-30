import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Первая квартира в новостройке — пошагово",
  description:
    "Линейный сценарий для покупателя в КР: каталог, паспорт Минстроя, застройщик, договор и переговоры. Не юридическая консультация.",
};

const steps = [
  {
    n: 1,
    title: "Сузить выбор в каталоге",
    body: "Отфильтруйте город, бюджет по $/м² и район. Добавьте 2–3 объекта в сравнение — так проще держать в голове параметры.",
    href: "/projects/",
    cta: "Каталог новостроек",
  },
  {
    n: 2,
    title: "Открыть паспорт объекта",
    body: "На карточке объекта перейдите по ссылке на minstroy.gov.kg. Прочитайте статус и сроки на официальной странице, а не только снимок в каталоге.",
    href: "/verify/",
    cta: "Чеклист проверки за 5 минут",
  },
  {
    n: 3,
    title: "Проверить застройщика",
    body: "Найдите компанию в каталоге и сверьте реестры лицензий Минстроя по названию/ИНН. Учтите разницу между офисом продаж и юрлицом в договоре.",
    href: "/companies/",
    cta: "Каталог компаний",
  },
  {
    n: 4,
    title: "Подготовиться к офису и договору",
    body: "Запросите проект договора и график платежей. Пройдите чеклист визита и раздел про цену в $ и сомах.",
    href: "/buyers/sales-visit/",
    cta: "Чеклист визита в офис",
  },
  {
    n: 5,
    title: "Переговоры",
    body: "Сформулируйте вопросы заранее; AI-переговорщик — вспомогательный сценарий, не замена юристу.",
    href: "/negotiator/",
    cta: "AI-переговорщик",
  },
];

export default function FirstApartmentPage() {
  return (
    <article className="section-padding bg-[var(--soft-white)] min-h-[60vh] print-checklist">
      <div className="container-custom max-w-3xl">
        <nav className="text-sm text-[var(--slate-blue)] mb-6 print-hidden">
          <Link href="/" className="hover:text-[var(--steel-blue)]">
            Главная
          </Link>
          <span className="mx-2">/</span>
          <span className="text-[var(--charcoal)]">Первая квартира</span>
        </nav>
        <h1 className="font-heading text-3xl md:text-4xl font-bold text-[var(--charcoal)] mb-4">
          Первая квартира в новостройке
        </h1>
        <p className="text-[var(--slate-blue)] mb-10">
          Ориентир на ~30–60 минут работы с открытыми источниками и каталогом. Решения по договору принимайте сами или с
          юристом.
        </p>
        <ol className="space-y-8">
          {steps.map((s) => (
            <li key={s.n} className="bg-white rounded-xl border border-gray-100 p-5 md:p-6">
              <span className="text-sm font-bold text-[var(--steel-blue)]">Шаг {s.n}</span>
              <h2 className="font-heading text-xl font-semibold text-[var(--charcoal)] mt-1 mb-2">{s.title}</h2>
              <p className="text-sm text-[var(--slate-blue)] mb-4">{s.body}</p>
              <Link href={s.href} className="text-sm font-medium text-[var(--steel-blue)] hover:underline print-hidden">
                {s.cta} →
              </Link>
            </li>
          ))}
        </ol>
        <div className="mt-10 flex flex-wrap gap-3 print-hidden">
          <Link href="/buyers/location-environment/" className="btn-secondary">
            Место и среда в КР
          </Link>
          <Link href="/guide/#price-currency" className="btn-secondary">
            Цена: $/м² и сомы
          </Link>
          <Link href="/glossary/" className="btn-secondary">
            Словарь
          </Link>
          <Link href="/methodology/" className="btn-secondary">
            Методология данных
          </Link>
        </div>
      </div>
    </article>
  );
}
