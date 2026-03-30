import type { Metadata } from "next";
import Link from "next/link";
import MergeChangelogSection from "@/components/MergeChangelogSection";
import mergeChangelogRaw from "@/data/mergeChangelog.json";
import type { MergeChangelogData } from "@/types/mergeChangelog";

export const metadata: Metadata = {
  title: "Обновления выгрузки каталога",
  description:
    "Автоматическое сравнение merged-companies.json: новые, удалённые и изменённые объекты elitka.kg. Не официальное уведомление.",
  openGraph: {
    title: "Изменения данных каталога",
    description: "Diff выгрузки новостроек и компаний между снимками JSON.",
  },
};

const data = mergeChangelogRaw as MergeChangelogData;

export default function UpdatesPage() {
  return (
    <article className="min-h-[60vh]">
      <div className="section-padding bg-[var(--soft-white)] border-b border-gray-100">
        <div className="container-custom max-w-3xl">
          <nav className="text-sm text-[var(--slate-blue)] mb-6">
            <Link href="/" className="hover:text-[var(--steel-blue)]">
              Главная
            </Link>
            <span className="mx-2">/</span>
            <span className="text-[var(--charcoal)]">Обновления данных</span>
          </nav>
          <p className="text-sm text-[var(--slate-blue)] mb-2">
            Как обновить файл: после scrape сохраните предыдущий{" "}
            <code className="text-xs bg-white px-1 rounded border">merged-companies.json</code> как{" "}
            <code className="text-xs bg-white px-1 rounded border">scraped/merged-companies.prev.json</code>, затем{" "}
            <code className="text-xs bg-white px-1 rounded border">npm run merge:diff</code>. Подробности — в комментарии к
            скрипту <code className="text-xs bg-white px-1 rounded border">scripts/diff-merged-companies.py</code> и в workflow
            GitHub Actions.
          </p>
        </div>
      </div>
      <MergeChangelogSection data={data} />
    </article>
  );
}
