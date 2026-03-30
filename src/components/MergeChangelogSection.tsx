import Link from "next/link";
import type { MergeChangelogData } from "@/types/mergeChangelog";

function fmtVal(v: unknown): string {
  if (v == null) return "—";
  if (typeof v === "string") return v || "—";
  return String(v);
}

export default function MergeChangelogSection({
  data,
  compact,
}: {
  data: MergeChangelogData;
  compact?: boolean;
}) {
  const { summary, added, removed, changed, noteRu, fromScrapedAt, toScrapedAt, generatedAt } = data;
  const hasActivity = summary.added > 0 || summary.removed > 0 || summary.changed > 0;

  const changedShow = compact ? changed.slice(0, 5) : changed;
  const addedShow = compact ? added.slice(0, 5) : added;
  const removedShow = compact ? removed.slice(0, 5) : removed;

  return (
    <section className="section-padding bg-white">
      <div className="container-custom max-w-3xl">
        {!compact && (
          <>
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-[var(--charcoal)] mb-2">
              Изменения в выгрузке каталога
            </h2>
            <p className="text-sm text-[var(--slate-blue)] mb-4">
              Сравнение файлов <code className="text-xs bg-gray-100 px-1 rounded">merged-companies.json</code> между двумя
              снимками (объекты elitka.kg по id).
            </p>
          </>
        )}
        {compact && (
          <div className="text-center mb-8">
            <span className="text-[var(--safety-orange)] text-sm font-semibold uppercase tracking-widest">Данные</span>
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-[var(--charcoal)] mt-2 mb-2">
              Что изменилось в каталоге
            </h2>
            <p className="text-sm text-[var(--slate-blue)] max-w-xl mx-auto">
              Автоматический diff выгрузки; не замена официальных реестров.
            </p>
          </div>
        )}

        <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-4 text-sm text-[var(--slate-blue)] mb-4">
          <p className="font-medium text-[var(--charcoal)] mb-2">Сводка</p>
          <ul className="space-y-1">
            <li>
              Добавлено объектов: <strong>{summary.added}</strong>
            </li>
            <li>
              Удалено из выгрузки: <strong>{summary.removed}</strong>
            </li>
            <li>
              Изменено по полям: <strong>{summary.changed}</strong>
              {summary.changedTruncated > 0 && (
                <span className="text-gray-500"> (в файле показано {summary.changedShown}, обрезано {summary.changedTruncated})</span>
              )}
            </li>
          </ul>
          <p className="text-xs text-gray-500 mt-3">
            Снимок diff: {new Date(generatedAt).toLocaleString("ru-RU")} · выгрузка «до»:{" "}
            {fromScrapedAt ? new Date(fromScrapedAt).toLocaleDateString("ru-RU") : "—"} · «после»:{" "}
            {toScrapedAt ? new Date(toScrapedAt).toLocaleDateString("ru-RU") : "—"}
          </p>
        </div>

        <p className="text-xs text-amber-900 bg-amber-50 border border-amber-100 rounded-lg p-3 mb-6">{noteRu}</p>

        {!hasActivity && (
          <p className="text-sm text-[var(--slate-blue)]">
            Между сравниваемыми файлами нет зафиксированных расхождений по отслеживаемым полям (или сравнивался файл с самим
            собой). После следующего scrape с сохранением предыдущего JSON здесь появятся детали.
          </p>
        )}

        {addedShow.length > 0 && (
          <div className="mb-6">
            <h3 className="font-heading text-lg font-semibold text-[var(--charcoal)] mb-2">Добавленные объекты</h3>
            <ul className="text-sm space-y-2 text-[var(--slate-blue)]">
              {addedShow.map((a) => (
                <li key={a.id}>
                  <Link href={a.path} className="text-[var(--steel-blue)] font-medium hover:underline">
                    {a.title}
                  </Link>
                  <span className="text-gray-500"> — {a.builderName}</span>
                </li>
              ))}
            </ul>
            {compact && added.length > addedShow.length && (
              <Link href="/updates/" className="text-sm text-[var(--steel-blue)] mt-2 inline-block hover:underline">
                Все добавленные →
              </Link>
            )}
          </div>
        )}

        {removedShow.length > 0 && (
          <div className="mb-6">
            <h3 className="font-heading text-lg font-semibold text-[var(--charcoal)] mb-2">Исчезли из выгрузки</h3>
            <p className="text-xs text-gray-500 mb-2">Объект мог быть снят с публикации в источнике — не обязательно «закрыт» юридически.</p>
            <ul className="text-sm space-y-1 text-[var(--slate-blue)]">
              {removedShow.map((r) => (
                <li key={r.id}>
                  {r.title} <span className="text-gray-500">— {r.builderName}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {changedShow.length > 0 && (
          <div className="mb-6">
            <h3 className="font-heading text-lg font-semibold text-[var(--charcoal)] mb-2">Изменения по объектам</h3>
            <ul className="space-y-4">
              {changedShow.map((c) => (
                <li key={c.id} className="border border-gray-100 rounded-lg p-3 bg-white">
                  <Link href={c.path} className="font-medium text-[var(--steel-blue)] hover:underline">
                    {c.title}
                  </Link>
                  <p className="text-xs text-gray-500 mb-2">{c.builderName}</p>
                  <dl className="text-xs space-y-1">
                    {c.fields.map((f) => (
                      <div key={f.field} className="grid gap-1 sm:grid-cols-[8rem_1fr_1fr]">
                        <dt className="text-gray-500">{f.label}</dt>
                        <dd className="text-red-800/90 line-through decoration-gray-400">{fmtVal(f.from)}</dd>
                        <dd className="text-emerald-800 font-medium">{fmtVal(f.to)}</dd>
                      </div>
                    ))}
                  </dl>
                </li>
              ))}
            </ul>
            {compact && changed.length > changedShow.length && (
              <Link href="/updates/" className="text-sm text-[var(--steel-blue)] mt-3 inline-block hover:underline">
                Полный список изменений →
              </Link>
            )}
          </div>
        )}

        {!compact && (
          <p className="text-sm">
            <Link href="/projects/" className="text-[var(--steel-blue)] font-medium hover:underline">
              Каталог новостроек
            </Link>
          </p>
        )}

        {compact && (
          <div className="text-center mt-6">
            <Link href="/updates/" className="btn-secondary text-sm">
              Все обновления выгрузки
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
