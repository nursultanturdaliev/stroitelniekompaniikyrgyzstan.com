import type { ProjectAiOpinion } from "@/types/projectAiOpinion";

const confLabel: Record<ProjectAiOpinion["confidence"], string> = {
  low: "Низкая",
  medium: "Средняя",
  high: "Высокая",
};

export default function ProjectAiOpinionSection({
  opinion,
  objectId,
}: {
  opinion?: ProjectAiOpinion;
  objectId: number;
}) {
  if (!opinion) {
    return (
      <section className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
        <h2 className="font-heading text-lg font-semibold text-[var(--charcoal)] mb-2">AI-мнение по объекту</h2>
        <p className="text-sm text-[var(--slate-blue)]">
          Для объекта `elitka-{objectId}` персональное AI-мнение еще не сгенерировано. Запустите генерацию:
          <code className="bg-gray-100 px-1 rounded ml-1">npm run ai:opinions</code>.
        </p>
      </section>
    );
  }

  return (
    <section className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h2 className="font-heading text-lg font-semibold text-[var(--charcoal)]">AI-мнение по объекту</h2>
        <span className="text-xs text-gray-500">
          Уверенность: {confLabel[opinion.confidence]}
          {opinion.model ? ` · ${opinion.model}` : ""}
        </span>
      </div>
      <p className="text-sm text-[var(--slate-blue)] mb-4">{opinion.summary}</p>
      <div className="grid md:grid-cols-3 gap-4 text-sm">
        <div className="rounded-lg border border-emerald-100 bg-emerald-50/60 p-3">
          <p className="font-medium text-emerald-900 mb-2">Плюсы</p>
          <ul className="list-disc pl-5 space-y-1 text-[var(--slate-blue)]">
            {opinion.positives.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg border border-amber-100 bg-amber-50/70 p-3">
          <p className="font-medium text-amber-900 mb-2">Осторожно</p>
          <ul className="list-disc pl-5 space-y-1 text-[var(--slate-blue)]">
            {opinion.cautions.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg border border-sky-100 bg-sky-50/80 p-3">
          <p className="font-medium text-sky-900 mb-2">Что спросить</p>
          <ul className="list-disc pl-5 space-y-1 text-[var(--slate-blue)]">
            {opinion.questions.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-4">
        AI-мнение формируется из открытых полей карточки и не является юридической консультацией.
      </p>
    </section>
  );
}
