/**
 * Статический экспорт: для каждого id объекта elitka создаётся отдельная HTML-страница (~938 маршрутов при текущей выгрузке).
 * При изменении merged-companies.json пересоберите сайт и оцените время `next build`.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCompanyBySlug } from "@/data/companies";
import { getElitkaProjectPageData, getElitkaProjectStaticParams } from "@/data/elitkaProjectsFromMerge";
import ElitkaObjectFactsSection from "@/components/ElitkaObjectFactsSection";
import PassportSnapshotSection from "@/components/PassportSnapshotSection";
import ProjectBuyerGuideSection from "@/components/ProjectBuyerGuideSection";
import ProjectBuyerHints from "@/components/ProjectBuyerHints";
import ProjectBuyerSnapshot from "@/components/ProjectBuyerSnapshot";
import ProjectBuilderTrustStrip from "@/components/ProjectBuilderTrustStrip";
import ProjectCounterpartyHint from "@/components/ProjectCounterpartyHint";
import ProjectCrossListingsSection from "@/components/ProjectCrossListingsSection";
import ProjectLocationContext from "@/components/ProjectLocationContext";
import ProjectMergeChangelogSnippet from "@/components/ProjectMergeChangelogSnippet";
import mergeChangelogRaw from "@/data/mergeChangelog.json";
import { buildProjectBuyerHints } from "@/lib/projectBuyerHints";
import type { MergeChangelogData } from "@/types/mergeChangelog";

const siteUrl = "https://stroitelniekompaniikyrgyzstan.com";

type Props = { params: Promise<{ projectId: string }> };

export function generateStaticParams() {
  return getElitkaProjectStaticParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { projectId } = await params;
  const data = getElitkaProjectPageData(projectId);
  if (!data) return { title: "Объект не найден" };
  return {
    title: `${data.title} — объект`,
    description: `${data.address}. Плановые данные из elitka.kg; проверяйте паспорт на minstroy.gov.kg.`,
    openGraph: {
      title: data.title,
      description: data.address,
      url: `${siteUrl}/projects/${data.projectId}/`,
    },
  };
}

export default async function ElitkaProjectPage({ params }: Props) {
  const { projectId } = await params;
  const data = getElitkaProjectPageData(projectId);
  if (!data) notFound();

  const builderCompany = getCompanyBySlug(data.builderSlug);
  const mergeChangelog = mergeChangelogRaw as MergeChangelogData;
  const buyerHints = buildProjectBuyerHints({
    passportUrl: data.passportUrl,
    statusCode: data.statusCode,
    plannedFinishDisplay: data.plannedFinishDisplay,
    passportSnapshot: data.passportSnapshot,
  });

  const mapHref =
    data.lat != null && data.lng != null
      ? `https://www.openstreetmap.org/?mlat=${data.lat}&mlon=${data.lng}#map=16/${data.lat}/${data.lng}`
      : null;

  const scrapedDisplay = data.scrapedAt
    ? new Date(data.scrapedAt).toLocaleDateString("ru-RU", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <article className="section-padding bg-[var(--soft-white)] min-h-[60vh]">
      <div className="container-custom max-w-3xl">
        <nav className="text-sm text-[var(--slate-blue)] mb-6">
          <Link href="/" className="hover:text-[var(--steel-blue)]">
            Главная
          </Link>
          <span className="mx-2">/</span>
          <Link href="/projects/" className="hover:text-[var(--steel-blue)]">
            Новостройки
          </Link>
          <span className="mx-2">/</span>
          <Link href={`/companies/${data.builderSlug}/`} className="hover:text-[var(--steel-blue)]">
            {data.builderName}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-[var(--charcoal)]">{data.title}</span>
        </nav>

        <h1 className="font-heading text-2xl md:text-3xl font-bold text-[var(--charcoal)] mb-2">{data.title}</h1>
        <p className="text-[var(--slate-blue)] mb-2">{data.address}</p>
        <p className="text-xs text-[var(--steel-blue)] mb-4">{data.projectType}</p>

        <ProjectBuyerHints hints={buyerHints} />

        <ProjectBuyerSnapshot
          statusLabel={data.statusLabel}
          plannedFinishDisplay={data.plannedFinishDisplay}
          displayPriceUsdM2={data.displayPriceUsdM2}
          displayPriceKgsM2={data.displayPriceKgsM2}
          listPriceUsdM2={data.listPriceUsdM2}
          listPriceKgsM2={data.listPriceKgsM2}
          elitkaFacts={data.elitkaFacts}
        />

        {data.galleryImageUrls.length > 0 && (
          <div className="mb-6 grid grid-cols-2 sm:grid-cols-3 gap-2 rounded-xl overflow-hidden border border-gray-100">
            {data.galleryImageUrls.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <a
                key={`${src}-${i}`}
                href={src}
                target="_blank"
                rel="noopener noreferrer"
                className="block aspect-[4/3] bg-[var(--warm-beige)]"
              >
                <img src={src} alt="" className="w-full h-full object-cover hover:opacity-95 transition-opacity" />
              </a>
            ))}
          </div>
        )}

        {builderCompany && <ProjectBuilderTrustStrip company={builderCompany} />}

        <ProjectCounterpartyHint
          builderName={data.builderName}
          builderSlug={data.builderSlug}
          hasCompanyProfile={!!builderCompany}
        />

        <ProjectBuyerGuideSection passportUrl={data.passportUrl} builderSlug={data.builderSlug} />

        {(data.plannedStartDisplay || data.plannedFinishDisplay) && (
          <section className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
            <h2 className="font-heading text-lg font-semibold text-[var(--charcoal)] mb-3">Плановые сроки (elitka.kg)</h2>
            <ul className="text-sm text-[var(--slate-blue)] space-y-2">
              {data.plannedStartDisplay && (
                <li>
                  <span className="text-gray-500">Начало (план): </span>
                  {data.plannedStartDisplay}
                </li>
              )}
              {data.plannedFinishDisplay && (
                <li>
                  <span className="text-gray-500">Сдача (план): </span>
                  {data.plannedFinishDisplay}
                </li>
              )}
              {data.initialPlannedFinishDisplay && (
                <li>
                  <span className="text-gray-500">Ранее указанная плановая сдача: </span>
                  {data.initialPlannedFinishDisplay}
                </li>
              )}
              {data.plannedDurationMonths != null && (
                <li>
                  <span className="text-gray-500">Плановая длительность (между датами): </span>~{data.plannedDurationMonths}{" "}
                  мес.
                </li>
              )}
            </ul>
            {data.scheduleSlipNote && (
              <p className="mt-3 text-sm text-[var(--slate-blue)] border-l-2 border-[var(--safety-orange)]/40 pl-3">
                {data.scheduleSlipNote}
              </p>
            )}
            <p className="mt-4 text-xs text-gray-400">
              Это план из каталога новостроек, а не подтверждённый факт сроков на объекте. Уточняйте у застройщика и в
              гос. реестрах.
            </p>
          </section>
        )}

        <ProjectLocationContext
          cityId={data.cityId}
          subdistrictNames={data.elitkaFacts?.subdistrictNames?.filter(Boolean) ?? []}
          address={data.address}
        />

        {(data.lat != null && data.lng != null) || mapHref ? (
          <section className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
            <h2 className="font-heading text-lg font-semibold text-[var(--charcoal)] mb-2">Координаты</h2>
            {data.lat != null && data.lng != null && (
              <p className="text-sm text-[var(--slate-blue)] mb-2">
                {data.lat.toFixed(5)}, {data.lng.toFixed(5)} (по данным elitka.kg)
              </p>
            )}
            {mapHref && (
              <a
                href={mapHref}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-[var(--steel-blue)] hover:underline"
              >
                Открыть на карте (OpenStreetMap)
              </a>
            )}
          </section>
        ) : null}

        {data.passportSnapshot && (
          <section className="mb-6">
            <h2 className="font-heading text-lg font-semibold text-[var(--charcoal)] mb-2">Паспорт (снимок страницы)</h2>
            <p className="text-xs text-gray-500 mb-3">
              Фрагмент полей с официальной HTML-страницы Минстроя; полный текст — только на сайте ведомства.
            </p>
            <PassportSnapshotSection passportUrl={data.passportUrl} snapshot={data.passportSnapshot} compact />
          </section>
        )}

        {data.elitkaFacts && (
          <ElitkaObjectFactsSection facts={data.elitkaFacts} objectId={data.elitkaObjectId} tiered />
        )}

        {data.crossListings && data.crossListings.length > 0 && (
          <ProjectCrossListingsSection items={data.crossListings} />
        )}

        <ProjectMergeChangelogSnippet elitkaObjectId={data.elitkaObjectId} data={mergeChangelog} />

        <div className="flex flex-wrap gap-3 mb-8">
          {data.passportUrl && (
            <a
              href={data.passportUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary inline-flex items-center gap-2"
            >
              Паспорт объекта (Минстрой)
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
          )}
          <Link href={`/companies/${data.builderSlug}/`} className="btn-secondary">
            Карточка компании
          </Link>
        </div>

        <div className="p-5 rounded-xl bg-amber-50 border border-amber-100 text-sm text-[var(--slate-blue)]">
          <p className="font-medium text-[var(--charcoal)] mb-2">Не юридическая консультация</p>
          <p className="mb-2">
            Каталог не заменяет проверку на{" "}
            <a href="https://minstroy.gov.kg" className="text-[var(--steel-blue)] underline" target="_blank" rel="noopener noreferrer">
              minstroy.gov.kg
            </a>
            . Содержимое паспорта объекта смотрите только на официальной странице Минстроя.
          </p>
          {scrapedDisplay && (
            <p className="text-xs text-gray-500">Снимок данных каталога (scrapedAt): {scrapedDisplay}.</p>
          )}
        </div>
      </div>
    </article>
  );
}
