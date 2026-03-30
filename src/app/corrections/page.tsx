import type { Metadata } from "next";
import Link from "next/link";
import CorrectionsForm from "@/components/CorrectionsForm";
import { CORRECTIONS_MAILTO } from "@/lib/siteContact";

export const metadata: Metadata = {
  title: "Заявка на правку каталога",
  description:
    "Для застройщиков и представителей: запрос исправления данных по публичным источникам. Без гарантии сроков и публикации.",
  robots: { index: true, follow: true },
};

export default function CorrectionsPage() {
  return (
    <article className="section-padding bg-[var(--soft-white)] min-h-[60vh]">
      <div className="container-custom max-w-2xl">
        <nav className="text-sm text-[var(--slate-blue)] mb-6">
          <Link href="/" className="hover:text-[var(--steel-blue)]">
            Главная
          </Link>
          <span className="mx-2">/</span>
          <span className="text-[var(--charcoal)]">Правка данных</span>
        </nav>

        <h1 className="font-heading text-3xl font-bold text-[var(--charcoal)] mb-4">Заявка на правку</h1>
        <p className="text-[var(--slate-blue)] mb-6">
          Каталог собирает открытые данные (elitka.kg, реестры Минстроя и др.). Если в карточке компании или объекта ошибка
          относительно <strong>публичного первоисточника</strong>, опишите её ниже. Мы не обещаем мгновенного обновления и не
          гарантируем публикацию правки — решение принимается вручную после проверки ссылки.
        </p>

        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-sm text-[var(--slate-blue)] mb-8">
          <p className="font-medium text-[var(--charcoal)] mb-2">Что сюда подходит</p>
          <ul className="list-disc pl-5 space-y-1 mb-3">
            <li>Опечатка в названии объекта при расхождении с elitka.kg или официальным паспортом.</li>
            <li>Неверная или устаревшая ссылка на паспорт на minstroy.gov.kg (с приложением актуальной ссылки).</li>
            <li>Явное несоответствие статуса или даты в JSON выгрузке и на указанной вами странице источника.</li>
          </ul>
          <p className="font-medium text-[var(--charcoal)] mb-2">Что сюда не подходит</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Жалобы на качество строительства или споры по договору — к застройщику, ведомствам или юристу.</li>
            <li>Удаление честной информации из реестров или «очернение конкурентов».</li>
            <li>Реклама и SEO-запросы без привязки к фактической ошибке в данных.</li>
          </ul>
        </div>

        <h2 className="font-heading text-lg font-semibold text-[var(--charcoal)] mb-3">Форма</h2>
        <p className="text-xs text-gray-500 mb-4">
          Почта для ручной отправки:{" "}
          <a className="text-[var(--steel-blue)] underline" href={CORRECTIONS_MAILTO}>
            {CORRECTIONS_MAILTO.replace("mailto:", "")}
          </a>{" "}
          (замените адрес в коде сайта при необходимости:{" "}
          <code className="bg-gray-100 px-1 rounded">src/lib/siteContact.ts</code>).
        </p>
        <CorrectionsForm />

        <div className="mt-10 pt-8 border-t border-gray-100 flex flex-wrap gap-3">
          <Link href="/about/" className="text-sm text-[var(--steel-blue)] hover:underline">
            О проекте
          </Link>
          <Link href="/updates/" className="text-sm text-[var(--steel-blue)] hover:underline">
            Обновления выгрузки
          </Link>
        </div>
      </div>
    </article>
  );
}
