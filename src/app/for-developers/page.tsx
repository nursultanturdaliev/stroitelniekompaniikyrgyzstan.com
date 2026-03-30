import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Для застройщиков и девелоперов",
  description:
    "Как попасть в каталог, откуда данные, политика правок. Без платного топа в выдаче.",
};

export default function ForDevelopersPage() {
  return (
    <article className="section-padding bg-[var(--soft-white)] min-h-[60vh]">
      <div className="container-custom max-w-3xl">
        <nav className="text-sm text-[var(--slate-blue)] mb-6">
          <Link href="/" className="hover:text-[var(--steel-blue)]">
            Главная
          </Link>
          <span className="mx-2">/</span>
          <span className="text-[var(--charcoal)]">Для застройщиков</span>
        </nav>
        <h1 className="font-heading text-3xl md:text-4xl font-bold text-[var(--charcoal)] mb-4">
          Для застройщиков и девелоперов
        </h1>
        <p className="text-[var(--slate-blue)] mb-8">
          Каталог строится на <strong>открытых данных</strong> (elitka.kg, реестры Минстроя и др.). Мы не продаём места в
          рейтинге и не гарантируем полноту карточки без вашего участия в первоисточниках.
        </p>

        <section className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
          <h2 className="font-heading text-lg font-semibold text-[var(--charcoal)] mb-3">Что публикуем</h2>
          <ul className="list-disc pl-5 text-sm text-[var(--slate-blue)] space-y-2">
            <li>Объекты новостроек из выгрузки elitka и связанные поля (сроки, цены в данных каталога, ссылки на паспорт).</li>
            <li>Карточки компаний из объединённой выгрузки; тип компании и реестры — по автоматическим правилам и открытым источникам.</li>
          </ul>
        </section>

        <section className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
          <h2 className="font-heading text-lg font-semibold text-[var(--charcoal)] mb-3">Ошибка в данных</h2>
          <p className="text-sm text-[var(--slate-blue)] mb-3">
            Если карточка расходится с <strong>публичным первоисточником</strong>, пришлите правку со ссылкой на страницу
            minstroy.gov.kg, elitka или официальный сайт.
          </p>
          <Link href="/corrections/" className="text-[var(--steel-blue)] font-medium hover:underline">
            Форма заявки на правку →
          </Link>
        </section>

        <section className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
          <h2 className="font-heading text-lg font-semibold text-[var(--charcoal)] mb-3">Чего мы не делаем</h2>
          <ul className="list-disc pl-5 text-sm text-[var(--slate-blue)] space-y-2">
            <li>Платное «поднятие» объекта в списке без пометки — не предлагается.</li>
            <li>Юридическая проверка сделки и гарантия «чистоты» застройщика — нет; только навигация к официальным источникам.</li>
          </ul>
        </section>

        <div className="flex flex-wrap gap-3">
          <Link href="/methodology/" className="btn-primary">
            Как собираются данные
          </Link>
          <Link href="/updates/" className="btn-secondary">
            Обновления выгрузки
          </Link>
        </div>
      </div>
    </article>
  );
}
