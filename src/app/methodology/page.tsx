import type { Metadata } from "next";
import Link from "next/link";
import DataQualityStrip, { type DataQualityStats } from "@/components/DataQualityStrip";
import dataQualityStatsRaw from "@/data/dataQualityStats.json";

export const metadata: Metadata = {
  title: "Как мы собираем данные",
  description:
    "Источники каталога: elitka.kg, реестры Минстроя, ограничения автосопоставления и что такое снимок паспорта объекта на сайте.",
  openGraph: {
    title: "Методология данных — Стройка KG",
    description: "Открытые источники, проверка паспорта и журнал изменений выгрузки.",
  },
};

const dataQualityStats = dataQualityStatsRaw as DataQualityStats;

export default function MethodologyPage() {
  return (
    <article className="section-padding bg-[var(--soft-white)] min-h-[60vh]">
      <div className="container-custom max-w-3xl">
        <p className="text-sm text-[var(--slate-blue)] mb-4">
          <Link href="/ky/methodology/" className="text-[var(--steel-blue)] hover:underline" lang="ky">
            Версия на кыргызском (кратко)
          </Link>
        </p>
        <nav className="text-sm text-[var(--slate-blue)] mb-6">
          <Link href="/" className="hover:text-[var(--steel-blue)]">
            Главная
          </Link>
          <span className="mx-2">/</span>
          <span className="text-[var(--charcoal)]">Как мы собираем данные</span>
        </nav>

        <h1 className="font-heading text-3xl md:text-4xl font-bold text-[var(--charcoal)] mb-4">
          Как мы собираем данные
        </h1>
        <p className="text-[var(--slate-blue)] text-lg mb-10">
          Каталог опирается на <strong>публичные</strong> источники. Мы не продаём места в рейтинге и не заменяем юридическую
          проверку договора — цель дать быстрый ориентир и ссылки на первоисточники.
        </p>

        <div className="space-y-10">
          <section className="bg-white rounded-xl border border-gray-100 p-6 md:p-8">
            <h2 className="font-heading text-xl font-semibold text-[var(--charcoal)] mb-3">Elitka.kg</h2>
            <p className="text-sm text-[var(--slate-blue)] leading-relaxed mb-4">
              Объекты новостроек и часть атрибутов (адрес, застройщик, ориентиры по цене за м², статус в интерфейсе elitka)
              подтягиваются из открытого API и страниц каталога. Это удобная «витрина» рынка, но данные могут отставать от
              реестра или сайта застройщика.
            </p>
            <p className="text-sm text-[var(--slate-blue)] leading-relaxed">
              Каталог объектов на сайте:{" "}
              <Link href="/projects/" className="text-[var(--steel-blue)] font-medium hover:underline">
                новостройки
              </Link>
              .
            </p>
          </section>

          <section className="bg-white rounded-xl border border-gray-100 p-6 md:p-8">
            <h2 className="font-heading text-xl font-semibold text-[var(--charcoal)] mb-3">Минстрой и паспорт объекта</h2>
            <p className="text-sm text-[var(--slate-blue)] leading-relaxed mb-4">
              Для объектов, у которых в выгрузке есть ссылка на реестр (gosstroy / паспорт на minstroy.gov.kg), на карточке
              может отображаться <strong>снимок полей паспорта</strong> — это не «живой» реестр в реальном времени, а
              результат последнего скрапа HTML-страницы (см. раздел про обновления). Если страница недоступна или разметка
              изменилась, в снимке будет пометка об ошибке парсинга.
            </p>
            <p className="text-sm text-[var(--slate-blue)] leading-relaxed">
              Пошаговая самопроверка без доверия к нам:{" "}
              <Link href="/verify/" className="text-[var(--steel-blue)] font-medium hover:underline">
                проверка за несколько минут
              </Link>
              . Термины:{" "}
              <Link href="/glossary/" className="text-[var(--steel-blue)] font-medium hover:underline">
                словарь
              </Link>
              .
            </p>
          </section>

          <section className="bg-white rounded-xl border border-gray-100 p-6 md:p-8">
            <h2 className="font-heading text-xl font-semibold text-[var(--charcoal)] mb-3">Другие источники и склейка</h2>
            <p className="text-sm text-[var(--slate-blue)] leading-relaxed mb-4">
              В общей выгрузке также участвуют данные с house.kg, 2GIS (при наличии ключа) и обход официальных сайтов
              компаний — с оговорками по полноте и актуальности. <strong>Автоматическое сопоставление</strong> объявлений и
              карточек между площадками не гарантируется: при сомнениях ориентируйтесь на ссылку первоисточника в карточке.
            </p>
            <p className="text-sm text-[var(--slate-blue)] leading-relaxed">
              Практический гид по выбору:{" "}
              <Link href="/guide/" className="text-[var(--steel-blue)] font-medium hover:underline">
                гид покупателя
              </Link>
              .
            </p>
          </section>

          <section className="bg-white rounded-xl border border-gray-100 p-6 md:p-8">
            <h2 className="font-heading text-xl font-semibold text-[var(--charcoal)] mb-3">Обновления и журнал изменений</h2>
            <p className="text-sm text-[var(--slate-blue)] leading-relaxed mb-4">
              После новой выгрузки мы сохраняем дифф по ключевым полям в JSON и показываем краткую сводку на сайте. Полный
              цикл подготовки данных (включая паспорта) описан во внутреннем чеклисте в репозитории — см.{" "}
              <code className="bg-gray-100 px-1 rounded text-xs">content-ops/RELEASE-CHECKLIST.md</code>.
            </p>
            <p className="text-sm text-[var(--slate-blue)] leading-relaxed">
              Публичная лента изменений:{" "}
              <Link href="/updates/" className="text-[var(--steel-blue)] font-medium hover:underline">
                обновления выгрузки
              </Link>
              . Ошибку в данных можно сообщить через{" "}
              <Link href="/corrections/" className="text-[var(--steel-blue)] font-medium hover:underline">
                форму правки
              </Link>
              .
            </p>
          </section>
        </div>

        <div className="mt-12">
          <DataQualityStrip stats={dataQualityStats} />
        </div>

        <div className="mt-12 flex flex-wrap gap-3">
          <Link href="/regions/" className="btn-primary">
            Регионы
          </Link>
          <Link href="/projects/" className="btn-secondary">
            Каталог новостроек
          </Link>
          <Link href="/glossary/" className="btn-secondary">
            Словарь
          </Link>
        </div>
      </div>
    </article>
  );
}
