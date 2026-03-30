import Link from "next/link";

export default function ProjectBuyerGuideSection({
  passportUrl,
  builderSlug,
}: {
  passportUrl?: string;
  builderSlug: string;
}) {
  const negotiatorHref = `/negotiator/?company=${encodeURIComponent(builderSlug)}`;

  return (
    <section className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
      <h2 className="font-heading text-lg font-semibold text-[var(--charcoal)] mb-2">Чеклист: новостройка</h2>
      <p className="text-xs text-gray-500 mb-4">
        Ниже — ориентиры для самопроверки, не юридическая консультация (см. предупреждение внизу страницы).
      </p>
      <ol className="list-decimal pl-5 space-y-3 text-sm text-[var(--slate-blue)]">
        <li>
          Откройте{" "}
          {passportUrl ? (
            <a
              href={passportUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--steel-blue)] font-medium hover:underline"
            >
              паспорт объекта
            </a>
          ) : (
            "паспорт объекта"
          )}{" "}
          на сайте Минстроя и сверьте ключевые поля (статус, сроки, площади, участники — как на официальной странице).
        </li>
        <li>Сравните плановые сроки в каталоге elitka.kg с паспортом; зафиксируйте расхождения и уточните у отдела продаж.</li>
        <li>
          Запросите у застройщика: проект договора, график платежей, что входит в отделку, какие условия применяются при
          переносе сроков сдачи (формулировки нейтральные; детали — только из ваших документов и переговоров).
        </li>
      </ol>
      <p className="mt-3 text-sm">
        <Link href="/verify/" className="text-[var(--steel-blue)] font-medium hover:underline">
          Проверка застройщика и объекта за 5 минут
        </Link>
        <span className="text-gray-500 text-xs"> — пошаговый ориентир по официальным источникам.</span>
      </p>
      <p className="mt-2 text-sm">
        <Link href="/glossary/" className="text-[var(--steel-blue)] font-medium hover:underline">
          Словарь терминов
        </Link>
        <span className="text-gray-500 text-xs"> — паспорт объекта, дольщик, ЖК и др.</span>
      </p>
      <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm">
        {passportUrl && (
          <li>
            <a
              href={passportUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--steel-blue)] font-medium hover:underline"
            >
              Официальный паспорт (Минстрой)
            </a>
          </li>
        )}
        <li>
          <Link href="/guide/" className="text-[var(--steel-blue)] font-medium hover:underline">
            Практический гид и реестры
          </Link>
        </li>
        <li>
          <Link href="/guide/#price-currency" className="text-[var(--steel-blue)] font-medium hover:underline">
            Цена $/м² и сомы
          </Link>
        </li>
        <li>
          <Link href="/buyers/first-apartment/" className="text-[var(--steel-blue)] font-medium hover:underline">
            Сценарий «первая квартира»
          </Link>
        </li>
        <li>
          <Link href="/buyers/sales-visit/" className="text-[var(--steel-blue)] font-medium hover:underline">
            Чеклист визита в офис
          </Link>
        </li>
        <li>
          <Link href="/buyers/location-environment/" className="text-[var(--steel-blue)] font-medium hover:underline">
            Место: география, воздух, быт
          </Link>
        </li>
        <li>
          <Link href={negotiatorHref} className="text-[var(--steel-blue)] font-medium hover:underline">
            AI-переговорщик
          </Link>
          <span className="text-gray-500 text-xs ml-1">(подставлена компания из ссылки; контекст диалога — ваша ответственность)</span>
        </li>
      </ul>
    </section>
  );
}
