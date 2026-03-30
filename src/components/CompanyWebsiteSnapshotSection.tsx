import type { CompanyWebsiteSnapshot } from "@/types/company";
import { companyWebsiteSnapshotsMeta } from "@/lib/companyWebsiteSnapshot";

const LONG_VALUE_MIN = 400;

function sortFieldEntries(fields: Record<string, string>): [string, string][] {
  const entries = Object.entries(fields);
  const score = (label: string) => {
    if (label.includes("Текст страницы") || label.includes("Внутренние ссылки")) return 200;
    if (label.includes("Ключевые слова")) return 150;
    return 0;
  };
  return entries.sort((a, b) => score(a[0]) - score(b[0]) || a[0].localeCompare(b[0], "ru"));
}

export default function CompanyWebsiteSnapshotSection({ snapshot }: { snapshot: CompanyWebsiteSnapshot }) {
  const meta = companyWebsiteSnapshotsMeta();
  const entries = sortFieldEntries(snapshot.fields);
  const openUrl = snapshot.finalUrl || snapshot.requestedUrl;

  if (!openUrl && entries.length === 0 && !snapshot.parseError) return null;

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-100">
      <h2 className="font-heading text-xl font-semibold text-[var(--charcoal)] mb-2">
        Данные с официального сайта компании
      </h2>
      <p className="text-xs text-gray-500 mb-4">
        Снято с публичных страниц <strong>того же сайта</strong> (без обхода сторонних доменов). При слабом блоке
        JSON-LD дополнительно запрашивались типичные пути (/contacts, /about и т.д.).
      </p>
      {snapshot.parseError && (
        <p className="text-sm text-amber-800 mb-3">
          Ошибка загрузки: {snapshot.parseError}
          {snapshot.httpStatus != null ? ` (HTTP ${snapshot.httpStatus})` : ""}
        </p>
      )}
      {entries.length > 0 && (
        <dl className="space-y-3 text-sm text-[var(--slate-blue)]">
          {entries.map(([k, v]) => {
            const long = (v?.length ?? 0) >= LONG_VALUE_MIN;
            return (
              <div key={k}>
                <dt className="text-gray-500 font-medium mb-1">{k}</dt>
                <dd
                  className={`font-medium text-[var(--charcoal)] break-words whitespace-pre-wrap ${
                    long ? "max-h-72 overflow-y-auto rounded border border-gray-100 bg-gray-50/80 p-3 text-xs" : ""
                  }`}
                >
                  {v || "—"}
                </dd>
              </div>
            );
          })}
        </dl>
      )}
      {snapshot.sameAs && snapshot.sameAs.length > 0 && (
        <div className="mt-4 text-xs text-[var(--slate-blue)]">
          <span className="font-medium text-[var(--charcoal)]">sameAs (schema.org): </span>
          <ul className="mt-1 list-disc pl-4 space-y-1">
            {snapshot.sameAs.map((u) => (
              <li key={u}>
                <a href={u} target="_blank" rel="noopener noreferrer" className="text-[var(--steel-blue)] underline">
                  {u}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
      {snapshot.extraPagesFetched && snapshot.extraPagesFetched.length > 0 && (
        <p className="mt-3 text-[10px] text-gray-400">
          Дополнительно загружены страницы: {snapshot.extraPagesFetched.join(", ")}
        </p>
      )}
      <p className="mt-4 text-[10px] text-gray-400 leading-snug">
        Не юридическая проверка и не подтверждение лицензий; сверяйте с актуальным сайтом компании.
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
            Выгрузка:{" "}
            {new Date(meta.scrapedAt).toLocaleDateString("ru-RU", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
            .
          </>
        )}
      </p>
      {openUrl && (
        <p className="mt-3">
          <a
            href={openUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--steel-blue)] font-medium text-sm underline"
          >
            Открыть сайт
          </a>
        </p>
      )}
    </div>
  );
}
