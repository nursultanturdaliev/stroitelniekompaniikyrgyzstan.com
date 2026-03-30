import type { CompletedProject } from "@/types/company";
import { minstroyPassportPagesMeta } from "@/lib/minstroyPassportSnapshot";

const HIGHLIGHT_LABELS = [
  "Статус объекта",
  "Тип объекта",
  "Наименование подрядчика",
  "ИНН подрядчика",
  "Площадь строительства",
  "Сметная стоимость",
  "Дата начала строительства",
  "Дата завершения  строительства",
  "Дата завершения строительства",
];

function sortEntries(fields: Record<string, string>): [string, string][] {
  const entries = Object.entries(fields);
  const score = (label: string) => {
    const i = HIGHLIGHT_LABELS.indexOf(label);
    return i >= 0 ? i : 100 + label.charCodeAt(0);
  };
  return entries.sort((a, b) => score(a[0]) - score(b[0]));
}

export default function PassportSnapshotSection({
  snapshot,
  compact,
  passportUrl,
}: {
  passportUrl?: string;
  snapshot?: CompletedProject["passportSnapshot"];
  compact?: boolean;
}) {
  if (!snapshot) return null;

  const meta = minstroyPassportPagesMeta();
  const entries = sortEntries(snapshot.fields);
  const showCount = compact ? Math.min(6, entries.length) : entries.length;
  const visible = entries.slice(0, showCount);
  const restCount = entries.length - visible.length;

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50/80 p-3 text-xs">
      <p className="font-semibold text-[var(--charcoal)] mb-2">Снимок страницы паспорта (Минстрой)</p>
      {snapshot.parseError && (
        <p className="text-amber-800 mb-2">
          Не удалось загрузить или разобрать страницу: {snapshot.parseError}
          {snapshot.httpStatus != null ? ` (HTTP ${snapshot.httpStatus})` : ""}
        </p>
      )}
      {visible.length > 0 && (
        <dl className="space-y-1.5 text-[var(--slate-blue)]">
          {visible.map(([k, v]) => (
            <div key={k} className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-x-2 gap-y-0.5">
              <dt className="text-gray-500">{k}</dt>
              <dd className="font-medium text-[var(--charcoal)] break-words">{v || "—"}</dd>
            </div>
          ))}
        </dl>
      )}
      {compact && restCount > 0 && (
        <p className="mt-2 text-gray-500">Ещё {restCount} полей — см. страницу объекта или официальный сайт.</p>
      )}
      {compact && passportUrl && (
        <p className="mt-3">
          <a
            href={passportUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--steel-blue)] font-medium hover:underline text-xs"
          >
            Открыть полную страницу паспорта на minstroy.gov.kg
          </a>
        </p>
      )}
      {!compact && entries.length === 0 && !snapshot.parseError && (
        <p className="text-gray-500">Поля на странице не распознаны (возможно, изменилась вёрстка сайта).</p>
      )}
      <p className="mt-2 text-[10px] text-gray-400 leading-snug">
        Текст снят с публичной HTML-страницы minstroy.gov.kg; не юридическая консультация. Сверяйте с официальным
        паспортом.
        {snapshot.fetchedAt && (
          <>
            {" "}
            Снимок:{" "}
            {new Date(snapshot.fetchedAt).toLocaleDateString("ru-RU", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
            .
          </>
        )}
        {meta.scrapedAt && !snapshot.fetchedAt && (
          <>
            {" "}
            Выгрузка паспортов:{" "}
            {new Date(meta.scrapedAt).toLocaleDateString("ru-RU", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
            .
          </>
        )}
      </p>
    </div>
  );
}
