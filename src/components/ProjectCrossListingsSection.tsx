import type { ProjectCrossListing } from "@/data/elitkaProjectsFromMerge";

export default function ProjectCrossListingsSection({ items }: { items: ProjectCrossListing[] }) {
  if (!items.length) return null;
  return (
    <section className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
      <h2 className="font-heading text-lg font-semibold text-[var(--charcoal)] mb-2">Другие площадки</h2>
      <p className="text-xs text-gray-500 mb-4">
        Сопоставление объявлений автоматическое; ссылки не проверены вручную. Источник указан у каждой строки.
      </p>
      <ul className="space-y-3 text-sm text-[var(--slate-blue)]">
        {items.map((it, i) => (
          <li key={`${it.url}-${i}`} className="border-b border-gray-50 last:border-0 pb-3 last:pb-0">
            <span className="text-gray-500 text-xs block mb-1">источник: {it.source_label}</span>
            {it.title && <p className="font-medium text-[var(--charcoal)] mb-1">{it.title}</p>}
            <a href={it.url} target="_blank" rel="noopener noreferrer" className="text-[var(--steel-blue)] hover:underline break-all">
              {it.url}
            </a>
            {it.note && <p className="text-xs text-gray-500 mt-1">{it.note}</p>}
          </li>
        ))}
      </ul>
    </section>
  );
}
