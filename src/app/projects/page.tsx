import type { Metadata } from "next";
import { getElitkaProjectFilterMeta, getElitkaProjectsList } from "@/data/elitkaProjectsFromMerge";
import ProjectsIndexClient from "@/components/ProjectsIndexClient";

export const metadata: Metadata = {
  title: "Новостройки Бишкек и КР — каталог и паспорт объекта",
  description:
    "Каталог новостроек из elitka.kg: фильтры по городу, застройщику, статусу и цене. Сверяйте карточку с паспортом на minstroy.gov.kg — см. verify и методологию.",
  openGraph: {
    title: "Каталог новостроек Кыргызстана",
    description: "Объекты с фильтрами, сравнением и ссылками на официальный паспорт, где он есть в выгрузке.",
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
