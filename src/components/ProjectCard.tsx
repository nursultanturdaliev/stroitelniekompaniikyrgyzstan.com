import type { CompletedProject } from "@/types/company";

export default function ProjectCard({ project }: { project: CompletedProject }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="h-40 bg-[var(--warm-beige)] flex items-center justify-center text-[var(--slate-blue)] text-sm">
        {project.images.length > 0 ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={project.images[0]} alt="" className="w-full h-full object-cover" />
        ) : (
          <span>Фото проекта</span>
        )}
      </div>
      <div className="p-4">
        <h4 className="font-heading font-semibold text-[var(--charcoal)] mb-1">{project.title}</h4>
        <p className="text-sm text-[var(--slate-blue)] mb-2">{project.description}</p>
        <div className="flex flex-wrap gap-2 text-xs text-[var(--slate-blue)]">
          {project.area && <span>{project.area}</span>}
          {project.year && <span>{project.year}</span>}
          <span className="text-[var(--steel-blue)]">{project.type}</span>
        </div>
      </div>
    </div>
  );
}
