import Link from "next/link";
import type { ConstructionTypeInfo } from "@/data/constructionTypes";

export default function TypeCard({ type }: { type: ConstructionTypeInfo }) {
  return (
    <Link
      href={`/types/${type.slug}/`}
      className="group bg-white rounded-xl p-6 border border-gray-100 hover:border-[var(--steel-blue)]/30 hover:shadow-lg transition-all card-hover"
    >
      <h3 className="font-heading text-xl font-semibold text-[var(--charcoal)] group-hover:text-[var(--steel-blue)] mb-2">
        {type.name}
      </h3>
      <p className="text-sm text-[var(--slate-blue)] line-clamp-3 mb-4">{type.summary}</p>
      <span className="text-sm font-medium text-[var(--safety-orange)]">Подробнее →</span>
    </Link>
  );
}
