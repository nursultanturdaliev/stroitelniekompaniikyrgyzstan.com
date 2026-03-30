import type { Metadata } from "next";
import { Suspense } from "react";
import { getElitkaProjectsList } from "@/data/elitkaProjectsFromMerge";
import CompareProjectsClient from "@/components/CompareProjectsClient";

const siteUrl = "https://stroitelniekompaniikyrgyzstan.com";

const compareDescription =
  "Сравнение до трёх новостроек из каталога: сроки, цены, статус, ссылки на паспорт minstroy.gov.kg и карточки elitka.kg. Дополняйте проверкой по официальным реестрам.";

export const metadata: Metadata = {
  title: "Сравнение новостроек — до трёх объектов",
  description: compareDescription,
  openGraph: {
    title: "Сравнение новостроек Кыргызстана",
    description: compareDescription,
    url: `${siteUrl}/projects/compare/`,
    type: "website",
  },
};

function CompareFallback() {
  return (
    <div className="section-padding container-custom max-w-6xl">
      <p className="text-[var(--slate-blue)]">Загрузка…</p>
    </div>
  );
}

export default function ProjectsComparePage() {
  const projects = getElitkaProjectsList();
  return (
    <section className="section-padding bg-[var(--soft-white)] min-h-[60vh]">
      <Suspense fallback={<CompareFallback />}>
        <CompareProjectsClient projects={projects} />
      </Suspense>
    </section>
  );
}
