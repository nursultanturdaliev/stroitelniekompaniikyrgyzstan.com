/** Общие подписи для плановых сроков объектов elitka.kg (не факт строительства). */

export function formatIsoDateRu(iso: string | null | undefined): string | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toLocaleDateString("ru-RU", { year: "numeric", month: "long", day: "numeric" });
}

export function plannedMonthsBetween(startIso: string | undefined, endIso: string | undefined): number | undefined {
  if (!startIso || !endIso) return undefined;
  const a = new Date(startIso);
  const b = new Date(endIso);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return undefined;
  const months = (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
  return months >= 0 ? months : undefined;
}

export function elitkaConstructionStatusLabel(status: string | undefined): string | undefined {
  if (!status) return undefined;
  const map: Record<string, string> = {
    IN_PROGRESS: "В строительстве (по данным elitka.kg)",
    COMPLETED: "Завершён (по данным elitka.kg)",
    PLANNED: "Запланирован (по данным elitka.kg)",
    SUSPENDED: "Приостановлен (по данным elitka.kg)",
  };
  return map[status] ?? `Статус: ${status} (elitka.kg)`;
}

export function scheduleSlipNoteRu(
  initialFinishIso: string | undefined,
  currentFinishIso: string | undefined,
): string | undefined {
  if (!initialFinishIso || !currentFinishIso) return undefined;
  const a = new Date(initialFinishIso).getTime();
  const b = new Date(currentFinishIso).getTime();
  if (Number.isNaN(a) || Number.isNaN(b) || a === b) return undefined;
  const di = formatIsoDateRu(initialFinishIso);
  const dc = formatIsoDateRu(currentFinishIso);
  if (!di || !dc) return undefined;
  return `Плановая дата сдачи обновлена в каталоге: было ${di}, сейчас указано ${dc}. Это не объяснение причин — только данные из elitka.kg.`;
}
