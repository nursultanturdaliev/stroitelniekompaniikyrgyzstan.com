import type { Metadata } from "next";
import Link from "next/link";
import { getLocationBuyerContext } from "@/data/locationBuyerContext";

export const metadata: Metadata = {
  title: "Место и среда при покупке жилья в Кыргызстане",
  description:
    "География, климат и воздух, транспорт и быт: ориентиры для Бишкека, Оша и других точек. Не мониторинг AQI и не юридическая консультация.",
};

const cityIds = [1, 2] as const;

export default function LocationEnvironmentPage() {
  const defaultCtx = getLocationBuyerContext(undefined);

  return (
    <article className="section-padding bg-[var(--soft-white)] min-h-[60vh]">
      <div className="container-custom max-w-3xl">
        <nav className="text-sm text-[var(--slate-blue)] mb-6">
          <Link href="/" className="hover:text-[var(--steel-blue)]">
            Главная
          </Link>
          <span className="mx-2">/</span>
          <span className="text-[var(--charcoal)]">Место и среда</span>
        </nav>

        <h1 className="font-heading text-3xl md:text-4xl font-bold text-[var(--charcoal)] mb-4">
          Место и среда: на что смотреть в Кыргызстане
        </h1>
        <p className="text-[var(--slate-blue)] mb-8">
          Каталог показывает адрес и карту, но не подменяет ваши ощущения на месте. Ниже — образовательные ориентиры: рельеф,
          сезонность, воздух в городах, транспорт и типичные вопросы к квартире. Мы <strong>не публикуем текущий AQI</strong> —
          для этого есть отдельные сервисы и датчики.
        </p>

        <div className="mb-10 p-4 bg-amber-50/80 rounded-xl border border-amber-100 text-sm text-[var(--slate-blue)]">
          <p className="font-medium text-[var(--charcoal)] mb-2">На каждой карточке объекта</p>
          <p>
            Блок «Место и среда» подставляется по <code className="text-xs bg-white px-1 rounded">city_id</code> из данных
            elitka и подсказкам по названию района. Откройте любой объект в{" "}
            <Link href="/projects/" className="text-[var(--steel-blue)] font-medium hover:underline">
              каталоге новостроек
            </Link>
            .
          </p>
        </div>

        <section className="mb-12 bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="font-heading text-xl font-semibold text-[var(--charcoal)] mb-4">{defaultCtx.label}</h2>
          <ContextBlocks ctx={defaultCtx} />
        </section>

        {cityIds.map((id) => {
          const ctx = getLocationBuyerContext(id);
          return (
            <section key={id} id={`city-${id}`} className="mb-12 bg-white rounded-xl border border-gray-100 p-6 scroll-mt-24">
              <h2 className="font-heading text-xl font-semibold text-[var(--charcoal)] mb-4">{ctx.label}</h2>
              <ContextBlocks ctx={ctx} />
            </section>
          );
        })}

        <div className="flex flex-wrap gap-3">
          <Link href="/regions/" className="btn-primary">
            Регионы каталога
          </Link>
          <Link href="/buyers/first-apartment/" className="btn-secondary">
            Первая квартира
          </Link>
          <Link href="/guide/#price-currency" className="btn-secondary">
            Цена и валюта
          </Link>
        </div>
      </div>
    </article>
  );
}

function ContextBlocks({ ctx }: { ctx: ReturnType<typeof getLocationBuyerContext> }) {
  return (
    <div className="space-y-4 text-sm text-[var(--slate-blue)]">
      <div>
        <h3 className="font-medium text-[var(--charcoal)] text-xs uppercase tracking-wide mb-1">География</h3>
        <p>{ctx.geography}</p>
      </div>
      <div>
        <h3 className="font-medium text-[var(--charcoal)] text-xs uppercase tracking-wide mb-1">Климат и воздух</h3>
        <p>{ctx.climateAndAir}</p>
      </div>
      <div>
        <h3 className="font-medium text-[var(--charcoal)] text-xs uppercase tracking-wide mb-1">Транспорт и инфраструктура</h3>
        <p>{ctx.mobilityAndInfrastructure}</p>
      </div>
      <div>
        <h3 className="font-medium text-[var(--charcoal)] text-xs uppercase tracking-wide mb-1">Нюансы</h3>
        <p>{ctx.localRiskNotes}</p>
      </div>
      <ul className="list-disc pl-5 space-y-1">
        {ctx.buyerChecks.map((c) => (
          <li key={c}>{c}</li>
        ))}
      </ul>
    </div>
  );
}
