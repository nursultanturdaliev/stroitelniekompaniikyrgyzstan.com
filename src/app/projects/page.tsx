import type { Metadata } from "next";
import { getElitkaProjectFilterMeta, getElitkaProjectsList } from "@/data/elitkaProjectsFromMerge";
import ProjectsIndexClient from "@/components/ProjectsIndexClient";

export const metadata: Metadata = {
  title: "Новостройки — каталог объектов",
  description:
    "Фильтры по городу, застройщику, статусу и цене. Подборка и сравнение объектов из elitka.kg; проверяйте данные на minstroy.gov.kg.",
  openGraph: {
    title: "Каталог новостроек Кыргызстана",
    description: "Объекты elitka.kg с фильтрами и сравнением до трёх позиций.",
  },
};

export default function ProjectsIndexPage() {
  const projects = getElitkaProjectsList();
  const filterMeta = getElitkaProjectFilterMeta(projects);
  return (
    <section className="section-padding bg-[var(--soft-white)] min-h-[60vh]">
      <ProjectsIndexClient projects={projects} filterMeta={filterMeta} />
    </section>
  );
}
