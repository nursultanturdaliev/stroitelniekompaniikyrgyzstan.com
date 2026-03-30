"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ElitkaProjectFilterMeta, ElitkaProjectListItem, ElitkaProjectPriceTier } from "@/data/elitkaProjectsFromMerge";
import { elitkaObjectPageUrl } from "@/lib/elitkaMedia";

const SHORTLIST_KEY = "stroika_project_shortlist_v1";
const MAX_COMPARE = 3;

const CITY_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Все города" },
  { value: "1", label: "Бишкек (city_id 1)" },
  { value: "2", label: "Ош (city_id 2)" },
];

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Любой статус" },
  { value: "IN_PROGRESS", label: "В строительстве" },
  { value: "COMPLETED", label: "Завершён" },
  { value: "PLANNED", label: "Запланирован" },
  { value: "SUSPENDED", label: "Приостановлен" },
];

const TIER_OPTIONS: { value: ElitkaProjectPriceTier | ""; label: string }[] = [
  { value: "", label: "Любая цена ($/м²)" },
  { value: "budget", label: "До ~$1100/м²" },
  { value: "mid", label: "$1100–1600/м²" },
  { value: "premium", label: "$1600–2200/м²" },
  { value: "luxury", label: "Выше ~$2200/м²" },
  { value: "unknown", label: "Цена не указана" },
];

function readShortlist(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SHORTLIST_KEY);
    if (!raw) return [];
    const p = JSON.parse(raw) as unknown;
    return Array.isArray(p) ? p.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function writeShortlist(ids: string[]) {
  try {
    localStorage.setItem(SHORTLIST_KEY, JSON.stringify(ids.slice(0, 20)));
  } catch {
    /* ignore */
  }
}

export default function ProjectsIndexClient({
  projects,
  filterMeta,
}: {
  projects: ElitkaProjectListItem[];
  filterMeta: ElitkaProjectFilterMeta;
}) {
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");
  const [status, setStatus] = useState("");
  const [builderSlug, setBuilderSlug] = useState("");
  const [tier, setTier] = useState<ElitkaProjectPriceTier | "">("");
  const [subdistrict, setSubdistrict] = useState("");
  const [shortlist, setShortlist] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setShortlist(readShortlist());
  }, []);

  const addToShortlist = useCallback((projectId: string) => {
    setShortlist((prev) => {
      if (prev.includes(projectId)) return prev;
      if (prev.length >= MAX_COMPARE) return prev;
      const next = [...prev, projectId];
      writeShortlist(next);
      return next;
    });
  }, []);

  const removeFromShortlist = useCallback((projectId: string) => {
    setShortlist((prev) => {
      const next = prev.filter((id) => id !== projectId);
      writeShortlist(next);
      return next;
    });
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return projects.filter((p) => {
      if (q) {
        const hay = `${p.title} ${p.address} ${p.builderName}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (city) {
        const want = Number.parseInt(city, 10);
        if (p.cityId !== want) return false;
      }
      if (status && p.statusCode !== status) return false;
      if (builderSlug && p.builderSlug !== builderSlug) return false;
      if (tier && p.priceTier !== tier) return false;
      const needle = subdistrict.trim().toLowerCase();
      if (needle && !p.subdistricts.some((s) => s.toLowerCase().includes(needle))) return false;
      return true;
    });
  }, [projects, query, city, status, builderSlug, tier, subdistrict]);

  const compareHref =
    shortlist.length > 0
      ? `/projects/compare/?ids=${shortlist.map(encodeURIComponent).join(",")}`
      : "/projects/compare/";

  const shareCompareUrl = useCallback(() => {
    if (shortlist.length === 0) return;
    const path = `${window.location.origin}/projects/compare/?ids=${shortlist.map(encodeURIComponent).join(",")}`;
    void navigator.clipboard.writeText(path).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    });
  }, [shortlist]);

  return (
    <div className="container-custom max-w-6xl pb-16">
      <header className="mb-8">
        <h1 className="font-heading text-3xl md:text-4xl font-bold text-[var(--charcoal)] mb-2">Новостройки</h1>
        <p className="text-[var(--slate-blue)] max-w-3xl">
          Объекты из открытого каталога elitka.kg: фильтры, подборка в браузере и сравнение до {MAX_COMPARE} позиций.
          У части карточек есть ссылка на <strong>паспорт объекта</strong> в реестре — сверяйте на{" "}
          <a href="https://minstroy.gov.kg" className="text-[var(--steel-blue)] underline" target="_blank" rel="noopener noreferrer">
            minstroy.gov.kg
          </a>
          . Как мы собираем данные:{" "}
          <Link href="/methodology/" className="text-[var(--steel-blue)] font-medium hover:underline">
            методология
          </Link>
          ; термины —{" "}
          <Link href="/glossary/" className="text-[var(--steel-blue)] font-medium hover:underline">
            словарь
          </Link>
          ; по городам —{" "}
          <Link href="/regions/" className="text-[var(--steel-blue)] font-medium hover:underline">
            регионы
          </Link>
          ; чеклист —{" "}
          <Link href="/verify/" className="text-[var(--steel-blue)] font-medium hover:underline">
            проверка
          </Link>
          .
        </p>
        <div className="flex flex-wrap gap-3 mt-4">
          <Link href="/projects/map/" className="btn-primary text-sm">
            Карта объектов
          </Link>
          <Link href="/verify/" className="btn-secondary text-sm">
            Проверка за 5 минут
          </Link>
          <Link href="/regions/" className="text-sm text-[var(--steel-blue)] font-medium hover:underline self-center">
            Регионы
          </Link>
          <Link href="/guide/" className="text-sm text-[var(--steel-blue)] font-medium hover:underline self-center">
            Гид по реестрам
          </Link>
        </div>
      </header>

      <div className="bg-white rounded-xl border border-gray-100 p-4 md:p-5 mb-6 space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="block text-sm">
            <span className="text-gray-500 block mb-1">Поиск</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Название, адрес, застройщик…"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm">
            <span className="text-gray-500 block mb-1">Город</span>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white"
            >
              {CITY_OPTIONS.map((o) => (
                <option key={o.value || "all"} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-gray-500 block mb-1">Статус (elitka)</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value || "all"} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-gray-500 block mb-1">Застройщик</span>
            <select
              value={builderSlug}
              onChange={(e) => setBuilderSlug(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white"
            >
              <option value="">Все застройщики</option>
              {filterMeta.builders.map((b) => (
                <option key={b.slug} value={b.slug}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-gray-500 block mb-1">Сегмент цены</span>
            <select
              value={tier}
              onChange={(e) => setTier((e.target.value as ElitkaProjectPriceTier | "") || "")}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white"
            >
              {TIER_OPTIONS.map((o) => (
                <option key={o.value || "all"} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-gray-500 block mb-1">Район (подпись в каталоге)</span>
            <input
              list="subdistrict-suggestions"
              value={subdistrict}
              onChange={(e) => setSubdistrict(e.target.value)}
              placeholder="Начните ввод или выберите"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
            <datalist id="subdistrict-suggestions">
              {filterMeta.subdistrictOptions.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100">
          <p className="text-sm text-[var(--slate-blue)]">
            Показано: <strong className="text-[var(--charcoal)]">{filtered.length}</strong> из {projects.length}
          </p>
          {shortlist.length > 0 && (
            <>
              <Link href={compareHref} className="btn-primary text-sm py-2 px-4">
                Сравнить ({shortlist.length})
              </Link>
              <Link href="/verify/" className="btn-secondary text-sm py-2 px-4">
                Проверка по чеклисту
              </Link>
              <button type="button" onClick={shareCompareUrl} className="btn-secondary text-sm py-2 px-4">
                {copied ? "Ссылка скопирована" : "Скопировать ссылку на сравнение"}
              </button>
              <button
                type="button"
                onClick={() => {
                  writeShortlist([]);
                  setShortlist([]);
                }}
                className="text-sm text-gray-500 hover:text-[var(--charcoal)] underline"
              >
                Очистить подборку
              </button>
            </>
          )}
        </div>
        {shortlist.length > 0 && (
          <p className="text-xs text-gray-500">
            Подборка хранится в этом браузере (до {MAX_COMPARE} объектов). Ссылка с параметром{" "}
            <code className="bg-gray-100 px-1 rounded">ids=</code> позволяет поделиться сравнением. Перед бронью пройдите{" "}
            <Link href="/verify/" className="text-[var(--steel-blue)] font-medium hover:underline">
              проверку по официальным источникам
            </Link>
            .
          </p>
        )}
      </div>

      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((p) => {
          const inList = shortlist.includes(p.projectId);
          const canAdd = !inList && shortlist.length < MAX_COMPARE;
          return (
            <li
              key={p.projectId}
              className="bg-white rounded-xl border border-gray-100 overflow-hidden flex flex-col shadow-sm hover:border-gray-200 transition-colors"
            >
              <Link href={`/projects/${p.projectId}/`} className="block aspect-[16/10] bg-[var(--warm-beige)] relative group">
                {p.thumbUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.thumbUrl} alt="" className="w-full h-full object-cover group-hover:opacity-95" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sm text-[var(--slate-blue)]">
                    Нет фото
                  </div>
                )}
              </Link>
              <div className="p-4 flex flex-col flex-1">
                <Link href={`/projects/${p.projectId}/`} className="font-heading font-semibold text-[var(--charcoal)] hover:text-[var(--steel-blue)] line-clamp-2">
                  {p.title}
                </Link>
                <p className="text-xs text-[var(--slate-blue)] mt-1 line-clamp-2">{p.address}</p>
                <p className="text-xs text-gray-500 mt-2">{p.builderName}</p>
                {p.statusLabel && <p className="text-xs font-medium text-[var(--charcoal)] mt-1">{p.statusLabel}</p>}
                {(p.displayPriceUsdM2 || p.displayPriceKgsM2) && (
                  <p className="text-xs text-[var(--slate-blue)] mt-1">
                    {p.displayPriceUsdM2 && p.displayPriceUsdM2 !== "0" && <span>${p.displayPriceUsdM2}/м²</span>}
                    {p.displayPriceUsdM2 && p.displayPriceKgsM2 && p.displayPriceKgsM2 !== "0" && " · "}
                    {p.displayPriceKgsM2 && p.displayPriceKgsM2 !== "0" && <span>{p.displayPriceKgsM2} сом/м²</span>}
                  </p>
                )}
                {p.plannedFinishDisplay && (
                  <p className="text-xs text-gray-500 mt-1">План сдачи: {p.plannedFinishDisplay}</p>
                )}
                <div className="mt-auto pt-3 flex flex-wrap gap-2">
                  <Link href={`/projects/${p.projectId}/`} className="text-xs font-medium text-[var(--steel-blue)] hover:underline">
                    Карточка объекта
                  </Link>
                  <a
                    href={elitkaObjectPageUrl(p.slug)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-gray-500 hover:underline"
                  >
                    elitka.kg
                  </a>
                  {inList ? (
                    <button
                      type="button"
                      onClick={() => removeFromShortlist(p.projectId)}
                      className="text-xs text-amber-800 hover:underline ml-auto"
                    >
                      Убрать из сравнения
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={!canAdd}
                      onClick={() => addToShortlist(p.projectId)}
                      className={`text-xs ml-auto ${canAdd ? "text-[var(--steel-blue)] hover:underline font-medium" : "text-gray-400 cursor-not-allowed"}`}
                      title={!canAdd ? `Максимум ${MAX_COMPARE} объекта` : undefined}
                    >
                      В сравнение
                    </button>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {filtered.length === 0 && (
        <p className="text-center text-[var(--slate-blue)] py-12">Нет объектов по выбранным фильтрам. Сбросьте фильтры или измените поиск.</p>
      )}
    </div>
  );
}
