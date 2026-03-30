import type { CompletedProject } from "@/types/company";

function normalizeForCompare(s: string): string {
  return s
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/ё/g, "е")
    .trim();
}

/** Достаёт значение даты завершения из полей снимка паспорта (подписи с сайта Минстроя). */
function passportFinishRaw(fields: Record<string, string>): string | undefined {
  const keys = [
    "Дата завершения строительства",
    "Дата завершения  строительства",
    "Плановая дата завершения строительства",
  ];
  for (const k of keys) {
    const v = fields[k]?.trim();
    if (v) return v;
  }
  for (const [k, v] of Object.entries(fields)) {
    if (/завершен/i.test(k) && /дата/i.test(k) && v?.trim()) return v.trim();
  }
  return undefined;
}

export type ProjectBuyerHintsInput = {
  passportUrl?: string;
  /** Код статуса из API elitka, например IN_PROGRESS */
  statusCode?: string;
  plannedFinishDisplay?: string;
  passportSnapshot?: CompletedProject["passportSnapshot"];
};

/**
 * Мягкие напоминания для покупателя — без оценки «безопасно/опасно».
 */
export function buildProjectBuyerHints(input: ProjectBuyerHintsInput): string[] {
  const hints: string[] = [];

  if (!input.passportUrl) {
    hints.push(
      "В выгрузке нет ссылки на паспорт объекта в реестре — уточните у застройщика реквизиты объекта и проверьте данные на minstroy.gov.kg вручную.",
    );
  }

  const code = input.statusCode?.toUpperCase();
  if (code === "SUSPENDED") {
    hints.push(
      "По данным каталога elitka статус объекта — «приостановлен». Спросите в офисе продаж причину и сверьте с актуальной страницей паспорта на сайте Минстроя.",
    );
  }
  if (code === "COMPLETED") {
    hints.push(
      "По данным каталога объект отмечен как завершённый — всё равно сверьте паспорт и договор: иногда статусы в разных источниках расходятся по времени обновления.",
    );
  }

  if (input.passportSnapshot?.parseError) {
    hints.push(
      "Снимок паспорта в каталоге не удалось разобрать — откройте официальную страницу паспорта по ссылке Минстроя и читайте текст только там.",
    );
  }

  const pFinish = input.passportSnapshot?.fields ? passportFinishRaw(input.passportSnapshot.fields) : undefined;
  const eFinish = input.plannedFinishDisplay?.trim();
  if (pFinish && eFinish) {
    if (normalizeForCompare(pFinish) !== normalizeForCompare(eFinish)) {
      hints.push(
        "Плановая дата сдачи в каталоге elitka и дата в полях снимка паспорта различаются — уточните у застройщика, какая дата актуальна, и перепроверьте на сайте Минстроя.",
      );
    }
  }

  return hints;
}
