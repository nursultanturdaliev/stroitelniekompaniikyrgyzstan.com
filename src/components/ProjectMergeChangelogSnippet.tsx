import Link from "next/link";
import type { MergeChangelogData } from "@/types/mergeChangelog";

export default function ProjectMergeChangelogSnippet({
  elitkaObjectId,
  data,
  maxFields = 4,
}: {
  elitkaObjectId: number;
  data: MergeChangelogData;
  maxFields?: number;
}) {
  const entry = data.changed.find((c) => c.id === elitkaObjectId);
  if (!entry || entry.fields.length === 0) return null;

  const fields = entry.fields.slice(0, maxFields);

  return (
    <section className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
      <h2 className="font-heading text-lg font-semibold text-[var(--charcoal)] mb-2">Что менялось в последней выгрузке</h2>
      <p className="text-xs text-gray-500 mb-3">
        По сравнению JSON между снимками (см.{" "}
        <Link href="/updates/" className="text-[var(--steel-blue)] hover:underline">
          обновления
        </Link>
        ). Не официальное уведомление ведомства.
      </p>
      <ul className="text-sm text-[var(--slate-blue)] space-y-2">
        {fields.map((f) => (
          <li key={f.field}>
            <span className="font-medium text-[var(--charcoal)]">{f.label}</span>
            <span className="text-gray-400"> · </span>
            <span className="line-through text-gray-400">{String(f.from ?? "—")}</span>
            <span className="text-gray-400"> → </span>
            <span>{String(f.to ?? "—")}</span>
          </li>
        ))}
      </ul>
      {entry.fields.length > maxFields && (
        <p className="text-xs text-gray-500 mt-2">Ещё {entry.fields.length - maxFields} полей — в полном журнале на /updates/.</p>
      )}
    </section>
  );
}
