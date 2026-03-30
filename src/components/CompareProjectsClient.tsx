"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import type { ElitkaProjectListItem } from "@/data/elitkaProjectsFromMerge";
import { elitkaObjectPageUrl } from "@/lib/elitkaMedia";

const MAX = 3;

function parseIds(raw: string | null): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(/[,;\s]+/)
    .map((s) => s.trim())
    .filter((s) => /^elitka-\d+$/.test(s))
    .slice(0, MAX);
}

export default function CompareProjectsClient({ projects }: { projects: ElitkaProjectListItem[] }) {
  const searchParams = useSearchParams();
  const ids = useMemo(() => parseIds(searchParams.get("ids")), [searchParams]);

  const byId = useMemo(() => {
    const m = new Map<string, ElitkaProjectListItem>();
    for (const p of projects) m.set(p.projectId, p);
    return m;
  }, [projects]);

  const selected = ids.map((id) => byId.get(id)).filter((x): x is ElitkaProjectListItem => Boolean(x));
  const missing = ids.filter((id) => !byId.has(id));

  const rows: { label: string; values: (string | undefined)[] }[] = selected.length
    ? [
        { label: "Объект", values: selected.map((p) => p.title) },
        { label: "Адрес", values: selected.map((p) => p.address) },
        { label: "Застройщик", values: selected.map((p) => p.builderName) },
        { label: "Статус (elitka)", values: selected.map((p) => p.statusLabel ?? p.statusCode ?? "—") },
        { label: "План сдачи", values: selected.map((p) => p.plannedFinishDisplay ?? "—") },
        {
          label: "Цена $/м²",
          values: selected.map((p) => (p.displayPriceUsdM2 && p.displayPriceUsdM2 !== "0" ? p.displayPriceUsdM2 : "—")),
        },
        {
          label: "Цена сом/м²",
          values: selected.map((p) => (p.displayPriceKgsM2 && p.displayPriceKgsM2 !== "0" ? p.displayPriceKgsM2 : "—")),
        },
        { label: "Район (каталог)", values: selected.map((p) => (p.subdistricts.length ? p.subdistricts.join(", ") : "—")) },
        {
          label: "Паспорт Минстроя",
          values: selected.map((p) => p.passportUrl ?? "—"),
        },
      ]
    : [];

  return (
    <div className="container-custom max-w-6xl pb-16">
      <nav className="text-sm text-[var(--slate-blue)] mb-6">
        <Link href="/projects/" className="hover:text-[var(--steel-blue)]">
          Новостройки
        </Link>
        <span className="mx-2">/</span>
        <span className="text-[var(--charcoal)]">Сравнение</span>
      </nav>

      <h1 className="font-heading text-2xl md:text-3xl font-bold text-[var(--charcoal)] mb-2">Сравнение объектов</h1>
      <p className="text-sm text-[var(--slate-blue)] mb-6 max-w-2xl">
        До {MAX} объектов. Добавьте их на странице{" "}
        <Link href="/projects/" className="text-[var(--steel-blue)] font-medium hover:underline">
          каталога новостроек
        </Link>{" "}
        или откройте ссылку вида{" "}
        <code className="text-xs bg-gray-100 px-1 rounded">/projects/compare/?ids=elitka-1113,elitka-1418</code>. Это
        ориентиры из открытых данных, не юридическая консультация.
      </p>

      {missing.length > 0 && (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg p-3 mb-4">
          Не найдены в выгрузке: {missing.join(", ")} (проверьте id в URL).
        </p>
      )}

      {selected.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
          <p className="text-[var(--slate-blue)] mb-4">Выберите объекты в каталоге или укажите параметр ids в адресе.</p>
          <Link href="/projects/" className="btn-primary inline-block">
            Перейти в каталог
          </Link>
        </div>
      )}

      {selected.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                <th className="text-left p-3 font-semibold text-[var(--charcoal)] w-40">Поле</th>
                {selected.map((p) => (
                  <th key={p.projectId} className="text-left p-3 font-semibold text-[var(--charcoal)] min-w-[11rem] align-top">
                    <Link href={`/projects/${p.projectId}/`} className="text-[var(--steel-blue)] hover:underline">
                      Открыть
                    </Link>
                    <div className="text-xs font-normal text-gray-500 mt-1 font-mono">{p.projectId}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-[var(--slate-blue)]">
              {rows.map((row) => (
                <tr key={row.label} className="border-b border-gray-50">
                  <td className="p-3 text-gray-500 align-top">{row.label}</td>
                  {row.values.map((v, i) => (
                    <td key={`${row.label}-${i}`} className="p-3 align-top">
                      {row.label === "Паспорт Минстроя" && v && v.startsWith("http") ? (
                        <a href={v} target="_blank" rel="noopener noreferrer" className="text-[var(--steel-blue)] break-all hover:underline">
                          Ссылка
                        </a>
                      ) : (
                        <span className="break-words">{v ?? "—"}</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
              <tr>
                <td className="p-3 text-gray-500">Действия</td>
                {selected.map((p) => (
                  <td key={p.projectId} className="p-3 space-y-2">
                    <Link href={`/projects/${p.projectId}/`} className="block text-[var(--steel-blue)] font-medium hover:underline">
                      Страница объекта
                    </Link>
                    <a
                      href={elitkaObjectPageUrl(p.slug)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-xs text-gray-500 hover:underline"
                    >
                      elitka.kg
                    </a>
                    <Link href={`/companies/${p.builderSlug}/`} className="block text-xs text-gray-500 hover:underline">
                      {p.builderName}
                    </Link>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
