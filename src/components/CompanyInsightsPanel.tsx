import type { CompanyInsights } from "@/lib/companyInsights";

export default function CompanyInsightsPanel({ insights }: { insights: CompanyInsights }) {
  const {
    sampleSize,
    totalInCatalog,
    sampleScopeNote,
    minimalNote,
    passportUrlCount,
    passportSnapshotCount,
    scheduleSlipCount,
    passportUrlPercent,
    passportSnapshotPercent,
    statusBuckets,
    distinctCities,
    priceRangeLabel,
    priceNote,
    hasLicense,
    minstroyBlacklistWarning,
    minstroyRegistryMatchCount,
    registryDisclaimer,
    officialRegistryUrl,
  } = insights;

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-100">
      <h2 className="font-heading text-xl font-semibold text-[var(--charcoal)] mb-2">Сводка по открытым данным</h2>
      <p className="text-xs text-gray-500 mb-4">
        Автоматический разбор полей карточки и выгрузки каталогов; не заменяет проверку на сайтах ведомств и у компании.
      </p>

      {minimalNote && <p className="text-sm text-[var(--slate-blue)] mb-4 border-l-2 border-gray-200 pl-3">{minimalNote}</p>}

      {sampleScopeNote && (
        <p className="text-sm text-[var(--safety-orange)]/90 mb-4 font-medium">{sampleScopeNote}</p>
      )}

      {sampleSize > 0 && (
        <ul className="text-sm text-[var(--slate-blue)] space-y-3 mb-4">
          <li>
            <span className="font-medium text-[var(--charcoal)]">Паспорт объекта (ссылка Минстрой): </span>
            {passportUrlCount} из {sampleSize} ({passportUrlPercent}%) в показанной выборке
          </li>
          <li>
            <span className="font-medium text-[var(--charcoal)]">Снимок полей паспорта (в выгрузке): </span>
            {passportSnapshotCount} из {sampleSize} ({passportSnapshotPercent}%)
          </li>
          <li>
            <span className="font-medium text-[var(--charcoal)]">Плановая сдача менялась в каталоге: </span>
            {scheduleSlipCount} объект{scheduleSlipCount === 1 ? "" : scheduleSlipCount < 5 ? "а" : "ов"} (по подписи «обновлена в каталоге»)
          </li>
          {distinctCities.length > 0 && (
            <li>
              <span className="font-medium text-[var(--charcoal)]">Города (эвристика по адресу в описании объектов): </span>
              {distinctCities.join(", ")}
            </li>
          )}
          {statusBuckets.length > 0 && (
            <li>
              <span className="font-medium text-[var(--charcoal)] block mb-1">Статусы строительства (elitka.kg, по выборке):</span>
              <ul className="list-disc pl-5 space-y-0.5">
                {statusBuckets.map((b) => (
                  <li key={b.code}>
                    {b.label}: {b.count}
                  </li>
                ))}
              </ul>
            </li>
          )}
        </ul>
      )}

      <div className="text-sm text-[var(--slate-blue)] space-y-2 mb-4 pt-2 border-t border-gray-100">
        <p>
          <span className="font-medium text-[var(--charcoal)]">Ценовой сегмент (каталог): </span>
          {priceRangeLabel}
          {priceNote ? ` — ${priceNote}` : ""}
        </p>
        <p>
          <span className="font-medium text-[var(--charcoal)]">Метка «лицензия» в каталоге: </span>
          {hasLicense ? "указана (есть связь с реестром и/или паспортом объекта по правилам выгрузки)" : "не подтверждена автоматически"}
        </p>
        {minstroyBlacklistWarning && (
          <p className="text-amber-800">
            <span className="font-medium">Чёрный список Минстроя: </span>
            есть совпадения по названию — см. предупреждение выше и проверьте официальный реестр.
          </p>
        )}
        {minstroyRegistryMatchCount !== undefined && (
          <div className="rounded-lg bg-gray-50 p-3 text-xs leading-relaxed">
            <p className="font-medium text-[var(--charcoal)] mb-1">
              Строк реестра Минстроя в сопоставлении с этой карточкой: {minstroyRegistryMatchCount}
            </p>
            <p className="text-gray-600">{registryDisclaimer}</p>
            <a
              href={officialRegistryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-2 text-[var(--steel-blue)] font-medium hover:underline"
            >
              Открыть реестр на minstroy.gov.kg
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
