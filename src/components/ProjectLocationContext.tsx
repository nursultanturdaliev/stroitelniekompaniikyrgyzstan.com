import Link from "next/link";
import { getBishkekSubdistrictExtras, getLocationBuyerContext } from "@/data/locationBuyerContext";
import { manualLocationAiOpinionText } from "@/data/locationAiOpinionText";
import type { ProjectAiOpinion } from "@/types/projectAiOpinion";

export default function ProjectLocationContext({
  cityId,
  subdistrictNames,
  address,
  aiLocationOpinion,
}: {
  cityId?: number;
  subdistrictNames: string[];
  address: string;
  aiLocationOpinion?: ProjectAiOpinion["locationOpinion"];
}) {
  const ctx = getLocationBuyerContext(cityId);
  const extras = cityId === 1 ? getBishkekSubdistrictExtras(subdistrictNames) : [];
  const locOpinion = aiLocationOpinion ?? manualLocationAiOpinionText;
  const locTitle = "AI-мнение: место и среда";
  const mapLabel = manualLocationAiOpinionText.mapLabel;

  return (
    <section className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
      <h2 className="font-heading text-lg font-semibold text-[var(--charcoal)] mb-1">Место и среда: что учесть</h2>
      <p className="text-xs text-gray-500 mb-4">
        Ориентир для покупателя в КР по городу <strong>{ctx.label}</strong>. Адрес в каталоге: {address || "—"}. Не
        экологическая экспертиза и не текущий мониторинг воздуха.
      </p>

      <div className="space-y-4 text-sm text-[var(--slate-blue)]">
        <div>
          <h3 className="font-medium text-[var(--charcoal)] text-xs uppercase tracking-wide mb-1">География и рельеф</h3>
          <p>{ctx.geography}</p>
        </div>
        <div>
          <h3 className="font-medium text-[var(--charcoal)] text-xs uppercase tracking-wide mb-1">Климат и воздух</h3>
          <p>{ctx.climateAndAir}</p>
        </div>
        <div>
          <h3 className="font-medium text-[var(--charcoal)] text-xs uppercase tracking-wide mb-1">Транспорт и быт</h3>
          <p>{ctx.mobilityAndInfrastructure}</p>
        </div>
        <div>
          <h3 className="font-medium text-[var(--charcoal)] text-xs uppercase tracking-wide mb-1">Местные нюансы</h3>
          <p>{ctx.localRiskNotes}</p>
        </div>
        {subdistrictNames.length > 0 && (
          <div>
            <h3 className="font-medium text-[var(--charcoal)] text-xs uppercase tracking-wide mb-1">
              Район в данных каталога
            </h3>
            <p>{subdistrictNames.join(", ")}</p>
          </div>
        )}
        {extras.length > 0 && (
          <div className="rounded-lg bg-[var(--soft-white)] border border-gray-100 p-3">
            <p className="text-xs font-semibold text-[var(--charcoal)] mb-2">По подписи района (эвристика)</p>
            <ul className="list-disc pl-5 space-y-1">
              {extras.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </div>
        )}
        <div>
          <h3 className="font-medium text-[var(--charcoal)] text-xs uppercase tracking-wide mb-2">На что посмотреть</h3>
          <ul className="list-disc pl-5 space-y-1">
            {ctx.buyerChecks.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg border border-violet-100 bg-violet-50/60 p-3">
          <p className="text-xs font-semibold text-[var(--charcoal)] mb-2">{locTitle}</p>
          <p className="text-sm text-[var(--slate-blue)] mb-2">{locOpinion.summary}</p>
          <div className="grid md:grid-cols-3 gap-3 text-xs text-[var(--slate-blue)]">
            <div>
              <p className="font-medium text-[var(--charcoal)] mb-1">Воздух и климат</p>
              <ul className="list-disc pl-4 space-y-1">
                {locOpinion.airAndClimate.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-medium text-[var(--charcoal)] mb-1">Транспорт и шум</p>
              <ul className="list-disc pl-4 space-y-1">
                {locOpinion.transportAndNoise.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-medium text-[var(--charcoal)] mb-1">Проверить лично</p>
              <ul className="list-disc pl-4 space-y-1">
                {locOpinion.localChecks.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
          </div>
          {ctx.links && ctx.links.length > 0 && (
            <div className="mt-2 text-xs">
              <a
                href={ctx.links.find((l) => l.href.startsWith("http"))?.href || "https://www.openstreetmap.org/"}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--steel-blue)] font-medium hover:underline"
              >
                {mapLabel}
              </a>
            </div>
          )}
        </div>
      </div>

      {ctx.links && ctx.links.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm">
          {ctx.links.map((l) =>
            l.href.startsWith("http") ? (
              <li key={l.href}>
                <a href={l.href} target="_blank" rel="noopener noreferrer" className="text-[var(--steel-blue)] font-medium hover:underline">
                  {l.label}
                </a>
              </li>
            ) : (
              <li key={l.href}>
                <Link href={l.href} className="text-[var(--steel-blue)] font-medium hover:underline">
                  {l.label}
                </Link>
              </li>
            ),
          )}
        </ul>
      )}
      <p className="mt-4 text-xs text-gray-500">
        Подробнее о выборе места и типичных вопросах:{" "}
        <Link href="/buyers/location-environment/" className="text-[var(--steel-blue)] hover:underline">
          место и среда в Кыргызстане
        </Link>
        .
      </p>
    </section>
  );
}
