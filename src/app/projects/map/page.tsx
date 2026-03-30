import type { Metadata } from "next";
import Link from "next/link";
import { getElitkaProjectsList } from "@/data/elitkaProjectsFromMerge";
import ProjectsMapClient from "@/components/ProjectsMapClient";

const siteUrl = "https://stroitelniekompaniikyrgyzstan.com";

const mapDescription =
  "Карта новостроек: объекты elitka.kg на OpenStreetMap по координатам каталога. Ориентир на местности; адрес и паспорт сверяйте на minstroy.gov.kg. Рядом — список с фильтрами и гид по проверке.";

export const metadata: Metadata = {
  title: "Карта новостроек Кыргызстана — elitka.kg на карте",
  description: mapDescription,
  openGraph: {
    title: "Карта новостроек Кыргызстана",
    description: mapDescription,
    url: `${siteUrl}/projects/map/`,
    type: "website",
  },
};

export default function ProjectsMapPage() {
  const projects = getElitkaProjectsList();
  return (
    <section className="section-padding bg-[var(--soft-white)] min-h-[60vh]">
      <div className="container-custom max-w-5xl pb-12">
        <nav className="text-sm text-[var(--slate-blue)] mb-6">
          <Link href="/" className="hover:text-[var(--steel-blue)]">
            Главная
          </Link>
          <span className="mx-2">/</span>
          <Link href="/projects/" className="hover:text-[var(--steel-blue)]">
            Новостройки
          </Link>
          <span className="mx-2">/</span>
          <span className="text-[var(--charcoal)]">Карта</span>
        </nav>

        <h1 className="font-heading text-3xl md:text-4xl font-bold text-[var(--charcoal)] mb-2">Карта объектов</h1>
        <p className="text-[var(--slate-blue)] mb-6 max-w-2xl">
          Маркеры строятся по координатам из карточек elitka.kg. Это ориентир на местности, а не юридическое описание границ участка — сверяйте с официальными документами и паспортом объекта.
        </p>
        <div className="flex flex-wrap gap-3 mb-6">
          <Link href="/projects/" className="btn-secondary text-sm">
            Список и фильтры
          </Link>
          <Link href="/regions/" className="text-sm text-[var(--steel-blue)] font-medium hover:underline self-center">
            Заметки по регионам
          </Link>
          <Link href="/verify/" className="text-sm text-[var(--steel-blue)] font-medium hover:underline self-center">
            Проверка за 5 минут
          </Link>
        </div>

        <ProjectsMapClient points={projects} />
      </div>
    </section>
  );
}
