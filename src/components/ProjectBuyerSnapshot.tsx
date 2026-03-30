import Link from "next/link";
import type { ElitkaObjectFacts } from "@/types/company";

function fmt(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "boolean") return v ? "да" : "нет";
  return String(v);
}

function parkingHint(facts?: ElitkaObjectFacts): string | undefined {
  if (!facts) return undefined;
  const u = facts.undergroundParking;
  const s = facts.surfaceParking;
  const active = (x: unknown) => {
    if (x == null || x === false || x === "") return false;
    if (typeof x === "number") return x > 0;
    if (typeof x === "boolean") return x;
    return true;
  };
  const hasU = active(u);
  const hasS = active(s);
  if (!hasU && !hasS) return undefined;
  if (hasU && hasS) return "подземный и наземный";
  if (hasU) return "есть (в т.ч. подземный)";
  return "есть (наземный)";
}

export type ProjectBuyerSnapshotProps = {
  statusLabel?: string;
  plannedFinishDisplay?: string;
  displayPriceUsdM2?: string;
  displayPriceKgsM2?: string;
  listPriceUsdM2?: string;
  listPriceKgsM2?: string;
  elitkaFacts?: ElitkaObjectFacts;
};

export default function ProjectBuyerSnapshot({
  statusLabel,
  plannedFinishDisplay,
  displayPriceUsdM2,
  displayPriceKgsM2,
  listPriceUsdM2,
  listPriceKgsM2,
  elitkaFacts,
}: ProjectBuyerSnapshotProps) {
  const rows: { label: string; value: string }[] = [];

  if (statusLabel) rows.push({ label: "Статус", value: statusLabel });
  if (plannedFinishDisplay) rows.push({ label: "План сдачи (каталог)", value: plannedFinishDisplay });

  const usd = displayPriceUsdM2?.trim();
  const kgs = displayPriceKgsM2?.trim();
  if (usd) rows.push({ label: "Цена, $/м²", value: usd });
  if (kgs) rows.push({ label: "Цена, сом/м²", value: kgs });
  const listUsd = listPriceUsdM2?.trim();
  const listKgs = listPriceKgsM2?.trim();
  if (listUsd && listUsd !== usd) rows.push({ label: "Цена в списке, $/м²", value: listUsd });
  if (listKgs && listKgs !== kgs) rows.push({ label: "Цена в списке, сом/м²", value: listKgs });

  if (elitkaFacts?.initialPayment != null && `${elitkaFacts.initialPayment}`.trim())
    rows.push({ label: "Первый взнос (каталог)", value: fmt(elitkaFacts.initialPayment) });
  if (elitkaFacts?.installmentPeriod != null && `${elitkaFacts.installmentPeriod}`.trim())
    rows.push({ label: "Рассрочка, период (каталог)", value: fmt(elitkaFacts.installmentPeriod) });

  if (elitkaFacts?.objectClass != null && `${elitkaFacts.objectClass}`.trim())
    rows.push({ label: "Класс ЖК", value: fmt(elitkaFacts.objectClass) });

  const floors = elitkaFacts?.floorCount;
  const flats = elitkaFacts?.totalFlats;
  if (floors != null || flats != null) {
    const bits = [
      floors != null ? `этажей: ${fmt(floors)}` : null,
      flats != null ? `квартир: ${fmt(flats)}` : null,
    ].filter(Boolean);
    if (bits.length) rows.push({ label: "Этажность / квартиры", value: bits.join(", ") });
  }

  const park = parkingHint(elitkaFacts);
  if (park) rows.push({ label: "Парковка (каталог)", value: park });

  if (elitkaFacts?.subdistrictNames?.length)
    rows.push({ label: "Район / микрорайон", value: elitkaFacts.subdistrictNames.join(", ") });

  if (rows.length === 0) return null;

  return (
    <section className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
        <h2 className="font-heading text-lg font-semibold text-[var(--charcoal)]">Кратко для покупателя</h2>
        <span className="text-xs text-gray-500">по данным elitka.kg</span>
      </div>
      <p className="text-xs text-gray-500 mb-4">
        Ориентиры из каталога новостроек; условия и цены подтверждайте у застройщика и в гос. реестрах. Про $/м² и оплату
        в сомах:{" "}
        <Link href="/guide/#price-currency" className="text-[var(--steel-blue)] font-medium hover:underline">
          кратко в гиде
        </Link>
        .
      </p>
      <dl className="text-sm text-[var(--slate-blue)] grid gap-x-4 gap-y-2 sm:grid-cols-2">
        {rows.map(({ label, value }) => (
          <div key={label} className="grid grid-cols-1 min-w-0">
            <dt className="text-gray-400">{label}</dt>
            <dd className="font-medium text-[var(--charcoal)] break-words">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
