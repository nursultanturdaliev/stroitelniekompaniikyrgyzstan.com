export default function ProjectBuyerHints({ hints }: { hints: string[] }) {
  if (hints.length === 0) return null;
  return (
    <section className="bg-sky-50/90 border border-sky-100 rounded-xl p-4 mb-6 print:hidden" aria-label="Ориентиры для уточнения">
      <h2 className="font-heading text-sm font-semibold text-[var(--charcoal)] mb-2">Спросите у застройщика или сверьте сами</h2>
      <p className="text-xs text-gray-600 mb-3">
        Не оценка надёжности объекта — только напоминание по данным каталога и паспорта.
      </p>
      <ul className="list-disc pl-5 space-y-2 text-sm text-[var(--slate-blue)]">
        {hints.map((h, i) => (
          <li key={i}>{h}</li>
        ))}
      </ul>
    </section>
  );
}
