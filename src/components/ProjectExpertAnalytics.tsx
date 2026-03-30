import type { ProjectExpertAnalytics } from "@/data/elitkaProjectsFromMerge";

const confidenceLabels: Record<ProjectExpertAnalytics["confidence"], string> = {
  low: "Низкая уверенность",
  medium: "Средняя уверенность",
  high: "Высокая уверенность",
};

export default function ProjectExpertAnalyticsSection({ analytics }: { analytics: ProjectExpertAnalytics }) {
  return (
    <section className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h2 className="font-heading text-lg font-semibold text-[var(--charcoal)]">Экспертная аналитика по объекту</h2>
        <span className="text-xs text-gray-500">
          Оценка: <strong className="text-[var(--charcoal)]">{analytics.score}/100</strong> ·{" "}
          {confidenceLabels[analytics.confidence]}
        </span>
      </div>
      <p className="text-sm text-[var(--slate-blue)] mb-4">{analytics.verdict}</p>

      <div className="grid md:grid-cols-3 gap-4 text-sm">
        <div className="rounded-lg border border-emerald-100 bg-emerald-50/60 p-3">
          <p className="font-medium text-emerald-900 mb-2">Сильные стороны</p>
          <ul className="list-disc pl-5 space-y-1 text-[var(--slate-blue)]">
            {analytics.strengths.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg border border-amber-100 bg-amber-50/70 p-3">
          <p className="font-medium text-amber-900 mb-2">Риски и ограничения</p>
          <ul className="list-disc pl-5 space-y-1 text-[var(--slate-blue)]">
            {analytics.risks.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg border border-sky-100 bg-sky-50/80 p-3">
          <p className="font-medium text-sky-900 mb-2">Что спросить в офисе</p>
          <ul className="list-disc pl-5 space-y-1 text-[var(--slate-blue)]">
            {analytics.questions.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ul>
        </div>
      </div>

      <p className="text-xs text-gray-500 mt-4">
        Это экспертная эвристика по открытым данным (elitka, паспорт, структура карточки), не юридическое заключение.
      </p>
    </section>
  );
}
