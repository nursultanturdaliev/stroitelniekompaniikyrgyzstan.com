import type { Metadata } from "next";
import Link from "next/link";
import { getElitkaProjectsList } from "@/data/elitkaProjectsFromMerge";
import ProjectsMapClient from "@/components/ProjectsMapClient";

export const metadata: Metadata = {
  title: "Карта новостроек",
  description: "Объекты из elitka.kg на карте OpenStreetMap по координатам каталога. Проверяйте адрес и статус на minstroy.gov.kg.",
  openGraph: {
    title: "Карта новостроек Кыргызстана",
    description: "Интерактивная карта объектов с координатами из открытого API elitka.kg.",
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
          <Link href="/verify/" className="text-sm text-[var(--steel-blue)] font-medium hover:underline self-center">
            Проверка за 5 минут
          </Link>
        </div>

        <ProjectsMapClient points={projects} />
      </div>
    </section>
  );
}
