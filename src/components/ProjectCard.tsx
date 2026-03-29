import Link from "next/link";
import type { CompletedProject } from "@/types/company";
import PassportSnapshotSection from "@/components/PassportSnapshotSection";

export default function ProjectCard({ project }: { project: CompletedProject }) {
  const detailHref =
    project.elitkaObjectId != null ? `/projects/elitka-${project.elitkaObjectId}/` : null;

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden flex flex-col h-full">
      <div className="h-40 bg-[var(--warm-beige)] flex items-center justify-center text-[var(--slate-blue)] text-sm">
        {project.images.length > 0 ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={project.images[0]} alt="" className="w-full h-full object-cover" />
        ) : (
          <span>Фото проекта</span>
        )}
      </div>
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h4 className="font-heading font-semibold text-[var(--charcoal)]">{project.title}</h4>
          {detailHref && (
            <Link
              href={detailHref}
              className="text-xs font-medium text-[var(--steel-blue)] hover:underline whitespace-nowrap flex-shrink-0"
            >
              Страница объекта
            </Link>
          )}
        </div>

        {project.elitkaStatusLabel && (
          <p className="text-xs text-[var(--charcoal)] mb-2 font-medium">{project.elitkaStatusLabel}</p>
        )}

        {(project.plannedStartDisplay || project.plannedFinishDisplay) && (
          <dl className="text-xs text-[var(--slate-blue)] space-y-1 mb-2">
            {project.plannedStartDisplay && (
              <div className="flex gap-2">
                <dt className="text-gray-400 flex-shrink-0">План начала</dt>
                <dd>{project.plannedStartDisplay}</dd>
              </div>
            )}
            {project.plannedFinishDisplay && (
              <div className="flex gap-2">
                <dt className="text-gray-400 flex-shrink-0">План сдачи</dt>
                <dd>{project.plannedFinishDisplay}</dd>
              </div>
            )}
            {project.initialPlannedFinishDisplay && (
              <div className="flex gap-2">
                <dt className="text-gray-400 flex-shrink-0">Ранее в каталоге</dt>
                <dd>{project.initialPlannedFinishDisplay}</dd>
              </div>
            )}
            {project.plannedDurationMonths != null && (
              <div className="flex gap-2">
                <dt className="text-gray-400 flex-shrink-0">План (мес.)</dt>
                <dd>~{project.plannedDurationMonths} мес. между плановыми датами</dd>
              </div>
            )}
          </dl>
        )}

        {project.scheduleSlipNote && (
          <p className="text-xs text-[var(--slate-blue)] mb-2 border-l-2 border-[var(--safety-orange)]/50 pl-2">
            {project.scheduleSlipNote}
          </p>
        )}

        <p className="text-sm text-[var(--slate-blue)] mb-2 flex-1">{project.description}</p>

        <div className="flex flex-wrap gap-2 text-xs text-[var(--slate-blue)] mb-3">
          {project.area && <span>{project.area}</span>}
          {project.year && <span>{project.year}</span>}
          <span className="text-[var(--steel-blue)]">{project.type}</span>
        </div>

        {project.passportUrl && (
          <a
            href={project.passportUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg bg-[var(--steel-blue)]/10 text-[var(--steel-blue)] hover:bg-[var(--steel-blue)]/15 transition-colors mb-2"
          >
            Паспорт объекта (Минстрой)
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        )}

        {project.passportSnapshot && (
          <div className="mb-2">
            <PassportSnapshotSection snapshot={project.passportSnapshot} compact />
          </div>
        )}

        <p className="text-[10px] text-gray-400 mt-auto leading-snug">
          Сроки плановые, источник — elitka.kg; не юридическая гарантия и не «факт» завершения строительства.
        </p>
      </div>
    </div>
  );
}
