import type { Metadata } from "next";
import { getElitkaProjectFilterMeta, getElitkaProjectsList } from "@/data/elitkaProjectsFromMerge";
import ProjectsIndexClient from "@/components/ProjectsIndexClient";

const siteUrl = "https://stroitelniekompaniikyrgyzstan.com";

const projectsIndexDescription =
  "Каталог новостроек из elitka.kg: фильтры по городу, застройщику, статусу и цене. Сверяйте карточку с паспортом на minstroy.gov.kg — разделы verify, guide и методология.";

export const metadata: Metadata = {
  title: "Новостройки Бишкек и КР — каталог и паспорт объекта",
  description: projectsIndexDescription,
  openGraph: {
    title: "Каталог новостроек Кыргызстана",
    description: projectsIndexDescription,
    url: `${siteUrl}/projects/`,
    type: "website",
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
