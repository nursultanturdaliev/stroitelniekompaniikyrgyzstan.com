import Link from "next/link";
import { getElitkaProjectsList, type ElitkaProjectListItem } from "@/data/elitkaProjectsFromMerge";
import { HOME_FEATURED_PROJECT_IDS } from "@/data/homeFeaturedProjects";

export default function HomeFeaturedProjects() {
  const list = getElitkaProjectsList();
  const byId = new Map(list.map((p) => [p.projectId, p]));
  const picked: ElitkaProjectListItem[] = HOME_FEATURED_PROJECT_IDS.map((id) => byId.get(id)).filter(
    (p): p is ElitkaProjectListItem => p != null,
  );
  if (picked.length === 0) return null;

  return (
    <section className="section-padding bg-white border-y border-gray-100">
      <div className="container-custom">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <p className="text-sm font-semibold text-[var(--safety-orange)] uppercase tracking-widest mb-2">
              Подборка редакции
            </p>
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-[var(--charcoal)]">
              Объекты для быстрого старта
            </h2>
            <p className="text-[var(--slate-blue)] mt-2 max-w-2xl text-sm md:text-base">
              Несколько карточек из каталога — без автоматического «топа» по рекламе. Сверяйте цены и паспорт на{" "}
              <Link href="/verify/" className="text-[var(--steel-blue)] font-medium hover:underline">
                странице проверки
              </Link>
              .
            </p>
          </div>
          <Link href="/projects/" className="btn-secondary self-start md:self-auto shrink-0">
            Все новостройки
          </Link>
        </div>
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {picked.map((p) => (
            <li key={p.projectId}>
              <Link
                href={`/projects/${p.projectId}/`}
                className="group block bg-[var(--soft-white)] rounded-xl border border-gray-100 overflow-hidden hover:border-[var(--steel-blue)]/30 hover:shadow-lg transition-all h-full flex flex-col"
              >
                <div className="relative aspect-[16/10] bg-gray-100 overflow-hidden">
                  {p.thumbUrl ? (
                    <img
                      src={p.thumbUrl}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">Нет фото</div>
                  )}
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="font-heading font-semibold text-[var(--charcoal)] group-hover:text-[var(--steel-blue)] transition-colors line-clamp-2">
                    {p.title}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">{p.builderName}</p>
                  <p className="text-sm text-[var(--slate-blue)] mt-2 line-clamp-2 flex-1">{p.address}</p>
                  {p.displayPriceUsdM2 && (
                    <p className="text-sm font-medium text-[var(--charcoal)] mt-3">от ~{p.displayPriceUsdM2} $/м²</p>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
