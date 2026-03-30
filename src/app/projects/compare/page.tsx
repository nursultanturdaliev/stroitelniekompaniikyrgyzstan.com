import type { Metadata } from "next";
import { Suspense } from "react";
import { getElitkaProjectsList } from "@/data/elitkaProjectsFromMerge";
import CompareProjectsClient from "@/components/CompareProjectsClient";

export const metadata: Metadata = {
  title: "Сравнение новостроек",
  description: "Сравните до трёх объектов из каталога: сроки, цены, ссылки на паспорт и elitka.kg.",
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
