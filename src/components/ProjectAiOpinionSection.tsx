import Link from "next/link";
import type { ProjectAiOpinion } from "@/types/projectAiOpinion";

const confLabel: Record<ProjectAiOpinion["confidence"], string> = {
  low: "Низкая",
  medium: "Средняя",
  high: "Высокая",
};

function PassportCta({ passportUrl }: { passportUrl?: string }) {
  return (
    <div className="mb-4 rounded-lg border border-[var(--steel-blue)]/25 bg-sky-50/50 px-3 py-2.5 text-sm text-[var(--slate-blue)]">
      {passportUrl ? (
        <p className="m-0">
          <a
            href={passportUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-[var(--steel-blue)] hover:underline"
          >
            Открыть паспорт на minstroy.gov.kg
          </a>
          <span className="text-gray-500 text-xs"> — сверьте статус и сроки по официальной странице.</span>
        </p>
      ) : (
        <p className="m-0">
          В карточке нет ссылки на паспорт — запросите её у застройщика.{" "}
          <Link href="/verify/" className="font-medium text-[var(--steel-blue)] hover:underline">
            Проверка за 5 минут
          </Link>
          <span className="text-gray-400"> · </span>
          <Link href="/guide/" className="font-medium text-[var(--steel-blue)] hover:underline">
            Гид и реестры
          </Link>
          .
        </p>
      )}
    </div>
  );
}

export default function ProjectAiOpinionSection({
  opinion,
  objectId,
  passportUrl,
}: {
  opinion?: ProjectAiOpinion;
  objectId: number;
  passportUrl?: string;
}) {
  const sourceNote = (
    <p className="text-xs text-gray-500 mb-2">
      Текст сформирован из открытых полей карточки каталога — это не ответ чата в реальном времени.
    </p>
  );

  if (!opinion) {
    return (
      <section className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
        <h2 className="font-heading text-lg font-semibold text-[var(--charcoal)] mb-2">AI-мнение по объекту</h2>
        {sourceNote}
        <PassportCta passportUrl={passportUrl} />
        <p className="text-sm text-[var(--slate-blue)]">
          Для объекта `elitka-{objectId}` персональное AI-мнение еще не сгенерировано. Запустите генерацию:
          <code className="bg-gray-100 px-1 rounded ml-1">npm run ai:opinions</code>.
        </p>
      </section>
    );
  }

  return (
    <section className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <h2 className="font-heading text-lg font-semibold text-[var(--charcoal)]">AI-мнение по объекту</h2>
        <span className="text-xs text-gray-500">Уверенность: {confLabel[opinion.confidence]}</span>
      </div>
      {sourceNote}
      <PassportCta passportUrl={passportUrl} />
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
        Ориентир для сравнения объектов: не заменяет проверку паспорта на minstroy.gov.kg и условий договора. Не является
        юридической консультацией.
      </p>
    </section>
  );
}
