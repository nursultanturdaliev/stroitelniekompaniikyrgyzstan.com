import Link from "next/link";
import {
  ELITKA_DOC_LABELS,
  ELITKA_ROOM_COUNT_LABELS,
} from "@/lib/elitkaObjectFacts";
import { elitkaObjectFileUrl, elitkaObjectPageUrl } from "@/lib/elitkaMedia";
import type { ElitkaObjectFacts } from "@/types/company";

function fmt(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "boolean") return v ? "да" : "нет";
  return String(v);
}

function docHref(objectId: number, raw: string): string {
  const t = raw.trim();
  if (!t) return "#";
  if (/^https?:\/\//i.test(t)) return t;
  return elitkaObjectFileUrl(objectId, t);
}

type Row = { label: string; value: string };

function collectSummaryRows(f: ElitkaObjectFacts): Row[] {
  const rows: Row[] = [];
  const add = (label: string, v: unknown) => {
    const s = fmt(v);
    if (s) rows.push({ label, value: s });
  };
  if (f.subdistrictNames?.length) add("Район / микрорайон", f.subdistrictNames.join(", "));
  add("Класс ЖК", f.objectClass);
  add("Корпусов", f.blocksCount);
  add("Этажность", f.floorCount);
  add("Подъездов", f.entrancesCount);
  add("Квартир (всего)", f.totalFlats);
  add("Общая площадь", f.totalArea);
  add("Земельный участок", f.landArea);
  add("Высота потолков", f.ceilingHeight);
  add("Подземный паркинг", f.undergroundParking);
  add("Наземный паркинг", f.surfaceParking);
  add("Отопление", f.heat);
  add("Технология строительства", f.constructionTechnology);
  add("Материал стен", f.wallMaterial);
  add("Фасад", f.facade);
  add("Первоначальный взнос", f.initialPayment);
  add("Рассрочка (период)", f.installmentPeriod);
  add("Окончание рассрочки", f.finishInstallmentDate);
  add("Квартал сдачи (план)", f.finishQuarter);
  add("Год сдачи (план)", f.finishYear);
  add("Месяц сдачи (план)", f.finishMonth);
  add("Индекс надёжности", f.reliabilityIndex);
  add("Оценка качества", f.qualityScore);
  add("Рейтинг (каталог)", f.rating);
  add("Отзывов", f.reviewsCount);
  add("Просмотров", f.viewCount);
  add("Звонков", f.callCount);
  add("Показов", f.showCount);
  add("ID города (elitka)", f.cityId);
  add("ID района (elitka)", f.districtId);
  add("Цена $/м² (деталь)", f.detailPriceUsd);
  add("Цена сом/м² (деталь)", f.detailPriceKgs);
  add("Карточка создана", f.createdAt);
  add("Карточка обновлена", f.updatedAt);
  if (f.isPromoted) add("Продвижение в каталоге", "да");
  return rows;
}

const DOC_KEYS: Array<keyof ElitkaObjectFacts> = [
  "docPresentation",
  "docStateExpertise",
  "docMasterPlan",
  "docObjectPassport",
  "docTypicalFloorPlan",
  "docArea",
];

export default function ElitkaObjectFactsSection({
  facts,
  objectId,
  compact,
}: {
  facts: ElitkaObjectFacts;
  objectId: number;
  compact?: boolean;
}) {
  const summary = collectSummaryRows(facts);
  const summaryShow = compact ? summary.slice(0, 8) : summary;

  const roomEntries = facts.roomCounts
    ? (Object.entries(facts.roomCounts) as Array<[keyof typeof ELITKA_ROOM_COUNT_LABELS, number]>)
        .filter(([, n]) => n != null && n > 0)
        .map(([k, n]) => ({ label: ELITKA_ROOM_COUNT_LABELS[k], count: n }))
    : [];

  const docLinks: { label: string; href: string }[] = [];
  for (const key of DOC_KEYS) {
    const raw = facts[key];
    if (typeof raw !== "string" || !raw.trim()) continue;
    const labelKey = key as string;
    docLinks.push({
      label: ELITKA_DOC_LABELS[labelKey] ?? labelKey,
      href: docHref(objectId, raw),
    });
  }

  const progress = facts.constructionProgress?.slice(0, compact ? 3 : 40) ?? [];
  const apts = facts.apartments?.slice(0, compact ? 0 : 30) ?? [];
  const chars = facts.characteristics?.slice(0, compact ? 6 : 200) ?? [];

  if (
    !summary.length &&
    !roomEntries.length &&
    !docLinks.length &&
    !progress.length &&
    !apts.length &&
    !chars.length &&
    !facts.relatedBuildings?.length
  ) {
    return null;
  }

  return (
    <section className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
      <h2 className="font-heading text-lg font-semibold text-[var(--charcoal)] mb-3">
        Данные объекта (elitka.kg)
      </h2>
      <p className="text-xs text-gray-500 mb-4">
        Поля ниже сняты из открытой карточки каталога; уточняйте у застройщика и по гос. реестрам.
      </p>

      {facts.slug && (
        <p className="text-sm mb-4">
          <a
            href={elitkaObjectPageUrl(facts.slug)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--steel-blue)] font-medium hover:underline"
          >
            Открыть на elitka.kg
          </a>
        </p>
      )}

      {summaryShow.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-[var(--charcoal)] mb-2">Основное</h3>
          <dl className="text-sm text-[var(--slate-blue)] grid gap-x-4 gap-y-1 sm:grid-cols-2">
            {summaryShow.map(({ label, value }) => (
              <div key={label} className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-1">
                <dt className="text-gray-400">{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {roomEntries.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-[var(--charcoal)] mb-2">Квартирография (по каталогу)</h3>
          <ul className="text-sm text-[var(--slate-blue)] flex flex-wrap gap-x-4 gap-y-1">
            {roomEntries.map(({ label, count }) => (
              <li key={label}>
                <span className="text-gray-400">{label}:</span> {count}
              </li>
            ))}
          </ul>
        </div>
      )}

      {docLinks.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-[var(--charcoal)] mb-2">Документы и файлы (каталог)</h3>
          <ul className="text-sm space-y-1">
            {docLinks.map(({ label, href }) => (
              <li key={label}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--steel-blue)] hover:underline"
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {chars.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-[var(--charcoal)] mb-2">Характеристики</h3>
          <dl className="text-sm text-[var(--slate-blue)] space-y-1">
            {chars.map((c, i) => (
              <div key={`${c.name}-${i}`} className="flex flex-col sm:flex-row sm:gap-2">
                <dt className="text-gray-400 sm:min-w-[10rem]">{c.name}</dt>
                <dd>{c.value || "—"}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {progress.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-[var(--charcoal)] mb-2">Ход строительства (каталог)</h3>
          <ul className="text-sm text-[var(--slate-blue)] space-y-2 list-disc pl-4">
            {progress.map((row, i) => (
              <li key={i}>
                {[row.title, row.date, row.percent != null ? `${row.percent}%` : null, row.progress]
                  .filter(Boolean)
                  .join(" · ")}
              </li>
            ))}
          </ul>
        </div>
      )}

      {apts.length > 0 && (
        <div className="mb-6 overflow-x-auto">
          <h3 className="text-sm font-semibold text-[var(--charcoal)] mb-2">Лоты / квартиры (фрагмент)</h3>
          <table className="text-xs w-full border-collapse">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="py-1 pr-2">№</th>
                <th className="py-1 pr-2">Этаж</th>
                <th className="py-1 pr-2">Комн.</th>
                <th className="py-1 pr-2">Площадь</th>
                <th className="py-1 pr-2">$/сом</th>
              </tr>
            </thead>
            <tbody className="text-[var(--slate-blue)]">
              {apts.map((row, i) => (
                <tr key={i} className="border-b border-gray-50">
                  <td className="py-1 pr-2">{fmt(row.number ?? row.id)}</td>
                  <td className="py-1 pr-2">{fmt(row.floor)}</td>
                  <td className="py-1 pr-2">{fmt(row.rooms)}</td>
                  <td className="py-1 pr-2">{fmt(row.area)}</td>
                  <td className="py-1 pr-2">
                    {[row.price_usd, row.price_kgs].filter(Boolean).map(fmt).join(" / ") || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {facts.relatedBuildings && facts.relatedBuildings.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-[var(--charcoal)] mb-2">Связанные объекты</h3>
          <ul className="text-sm text-[var(--slate-blue)] space-y-2">
            {facts.relatedBuildings.map((r) => (
              <li key={r.id}>
                <Link href={`/projects/elitka-${r.id}/`} className="text-[var(--steel-blue)] hover:underline font-medium">
                  {r.title}
                </Link>
                {r.address && <span className="text-gray-500"> — {r.address}</span>}
                {r.gosstroy_registry && (
                  <>
                    {" · "}
                    <a
                      href={r.gosstroy_registry}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--steel-blue)] hover:underline"
                    >
                      паспорт
                    </a>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
