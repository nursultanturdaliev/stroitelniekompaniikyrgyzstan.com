import Link from "next/link";

export type DataQualityStats = {
  generatedAt: string;
  scrapedAt: string | null;
  elitkaObjectCount: number;
  withPassportUrlCount: number;
  withPassportSnapshotCount: number;
  noteRu: string;
};

function pct(n: number, d: number): string {
  if (d <= 0) return "—";
  return `${Math.round((100 * n) / d)}%`;
}

export default function DataQualityStrip({ stats }: { stats: DataQualityStats }) {
  return (
    <section className="bg-white rounded-xl border border-gray-100 p-5 mb-8">
      <h2 className="font-heading text-lg font-semibold text-[var(--charcoal)] mb-2">Качество и полнота выгрузки</h2>
      <p className="text-xs text-gray-500 mb-4">
        Сводка генерируется скриптом <code className="bg-gray-100 px-1 rounded">npm run data:stats</code> после обновления{" "}
        <code className="bg-gray-100 px-1 rounded">scraped/merged-companies.json</code>.{" "}
        <Link href="/methodology/" className="text-[var(--steel-blue)] hover:underline">
          Методология
        </Link>
        .
      </p>
      <dl className="grid sm:grid-cols-2 gap-3 text-sm text-[var(--slate-blue)]">
        <div>
          <dt className="text-gray-500">Дата снимка merged JSON</dt>
          <dd className="font-medium text-[var(--charcoal)]">{stats.scrapedAt ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Объектов elitka в каталоге</dt>
          <dd className="font-medium text-[var(--charcoal)]">{stats.elitkaObjectCount}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Со ссылкой на паспорт (URL в данных)</dt>
          <dd className="font-medium text-[var(--charcoal)]">
            {stats.withPassportUrlCount} ({pct(stats.withPassportUrlCount, stats.elitkaObjectCount)})
          </dd>
        </div>
        <div>
          <dt className="text-gray-500">Со снимком полей паспорта в JSON</dt>
          <dd className="font-medium text-[var(--charcoal)]">
            {stats.withPassportSnapshotCount} ({pct(stats.withPassportSnapshotCount, stats.elitkaObjectCount)})
          </dd>
        </div>
      </dl>
      <p className="text-xs text-gray-500 mt-4">{stats.noteRu}</p>
      <p className="text-[10px] text-gray-400 mt-2">Сгенерировано: {stats.generatedAt}</p>
    </section>
  );
}
