import type { ConstructionCompany, CompletedProject, PriceRangeTier, ServiceCategory } from "@/types/company";
import mergedRaw from "../../scraped/merged-companies.json";

type ElitkaObject = {
  title: string;
  slug: string;
  address: string;
  price_usd_m2: string;
  price_kgs_m2: string;
  gosstroy_registry: string | null;
  finish: string | null;
};

type ElitkaBuilder = {
  source: string;
  builderId: number;
  name: string;
  slug: string;
  phone: string;
  whatsapp: string;
  objects: ElitkaObject[];
};

type HouseKgCompany = {
  source: string;
  slug: string;
  name: string;
  url: string;
  phones: string[];
  phone: string;
  website: string | null;
  email: string | null;
  description: string | null;
};

type MergedFile = {
  scrapedAt: string;
  sources: {
    elitka: { builders: ElitkaBuilder[] };
    house_kg: { companies: HouseKgCompany[] };
  };
};

const merged = mergedRaw as MergedFile;

function parseUsd(s: string): number | null {
  const n = Number.parseFloat(String(s).replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function priceTierFromUsd(values: number[]): PriceRangeTier {
  if (values.length === 0) return "mid";
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  if (avg < 1000) return "budget";
  if (avg < 1500) return "mid";
  if (avg < 2000) return "premium";
  return "luxury";
}

function inferCityFromAddress(address: string): string {
  const a = address.toLowerCase();
  if (a.includes("бишкек") || a.includes("bishkek")) return "Бишкек";
  if (a.includes("ош") && !a.includes("орто")) return "Ош";
  if (a.includes("кант")) return "Кант";
  if (a.includes("токмок")) return "Токмок";
  if (a.includes("каракол")) return "Каракол";
  if (a.includes("орто-сай") || a.includes("орто сай")) return "с. Орто-Сай";
  if (a.includes("беш кунгей") || a.includes("беш-кунгей")) return "с. Беш-Кунгей";
  if (a.includes("кок-джар") || a.includes("кок джар")) return "с. Кок-Джар";
  if (a.includes("джал")) return "Джал";
  return "Бишкек";
}

function projectTypeFromTitle(title: string): ServiceCategory {
  const t = title.toLowerCase();
  if (t.includes("жк") || t.includes("комплекс")) return "Многоэтажное строительство";
  return "Строительство домов";
}

function elitkaObjectToProject(o: ElitkaObject): CompletedProject {
  const y = o.finish ? new Date(o.finish).getFullYear() : undefined;
  const reg = o.gosstroy_registry && String(o.gosstroy_registry).startsWith("http");
  const desc = [o.address.trim(), reg ? `Реестр: ${o.gosstroy_registry}` : null].filter(Boolean).join("\n");
  const usd = parseUsd(o.price_usd_m2);
  const kgs = parseUsd(o.price_kgs_m2);
  const priceBits = [
    usd ? `от $${Math.round(usd)}/м²` : null,
    kgs ? `от ${Math.round(kgs).toLocaleString("ru-RU")} сом/м²` : null,
  ].filter(Boolean);
  return {
    title: o.title,
    description: desc || "Объект из каталога elitka.kg",
    images: [],
    area: priceBits.length ? priceBits.join(" · ") : undefined,
    type: projectTypeFromTitle(o.title),
    year: y && y > 1990 ? y : undefined,
  };
}

function formatWhatsapp(raw: string): string | undefined {
  const d = raw.replace(/\D/g, "");
  if (d.length < 9) return undefined;
  return d.startsWith("996") ? `+${d}` : `+996${d}`;
}

function elitkaToCompany(b: ElitkaBuilder): ConstructionCompany {
  const usdPrices = b.objects.map((o) => parseUsd(o.price_usd_m2)).filter((n): n is number => n !== null);
  const tier = priceTierFromUsd(usdPrices);
  const minU = usdPrices.length ? Math.min(...usdPrices) : null;
  const maxU = usdPrices.length ? Math.max(...usdPrices) : null;
  const priceNote =
    minU && maxU && minU !== maxU
      ? `Ориентир по каталогу: $${Math.round(minU)}–${Math.round(maxU)}/м²`
      : minU
        ? `Ориентир по каталогу: от $${Math.round(minU)}/м²`
        : "Цену уточняйте у застройщика";

  const hasRegistry = b.objects.some((o) => o.gosstroy_registry && String(o.gosstroy_registry).startsWith("http"));
  const primaryCity =
    b.objects.map((o) => inferCityFromAddress(o.address)).find((c) => c) ?? "Бишкек";

  const scrapedDate = merged.scrapedAt ? new Date(merged.scrapedAt).toLocaleDateString("ru-RU") : "";

  return {
    id: `elitka-${b.builderId}-${b.slug}`,
    slug: b.slug,
    name: b.name,
    type: ["Застройщик", "Строительная компания"],
    tagline:
      b.objects.length === 1
        ? b.objects[0].title
        : `${b.objects.length} объектов в каталоге новостроек (elitka.kg)`,
    description: [
      `Карточка собрана из открытых данных elitka.kg${scrapedDate ? ` (${scrapedDate})` : ""}.`,
      "",
      "Объекты в базе:",
      ...b.objects.slice(0, 12).map((o) => `• ${o.title}${o.address ? ` — ${o.address.trim()}` : ""}`),
      b.objects.length > 12 ? `… и ещё ${b.objects.length - 12}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
    services: ["Новостройки", "Жилые комплексы", "Продажа квартир от застройщика"],
    specializations: ["Многоэтажное строительство", "Строительство домов"],
    priceRange: tier,
    priceNote,
    priceDetails: b.objects.slice(0, 6).map((o) => {
      const u = parseUsd(o.price_usd_m2);
      return {
        service: o.title,
        price: u ? `от $${Math.round(u)}/м²` : "цена по запросу",
      };
    }),
    experience: 0,
    projectCount: b.objects.length,
    completedProjects: b.objects.slice(0, 36).map(elitkaObjectToProject),
    contacts: {
      phone: b.phone || undefined,
      whatsapp: formatWhatsapp(b.whatsapp),
    },
    location: {
      city: primaryCity,
      address: b.objects[0]?.address?.trim(),
      lat: 42.8746,
      lng: 74.5698,
    },
    workArea: ["Кыргызстан", primaryCity],
    hasLicense: hasRegistry,
    licenseInfo: hasRegistry ? "Есть ссылки на карточки гос. реестра по объектам" : undefined,
    highlights: [`${b.objects.length} объект(ов)`, "elitka.kg"],
    sourceVerified: [b.source],
  };
}

function houseKgToCompany(c: HouseKgCompany): ConstructionCompany {
  const scrapedDate = merged.scrapedAt ? new Date(merged.scrapedAt).toLocaleDateString("ru-RU") : "";
  return {
    id: `house-kg-${c.slug}`,
    slug: c.slug,
    name: c.name,
    type: ["Строительная компания", "Застройщик"],
    tagline: c.description?.trim() || "Компания в каталоге объявлений house.kg",
    description: [
      `Данные из house.kg${scrapedDate ? ` (выгрузка ${scrapedDate})` : ""}.`,
      c.description?.trim() || "",
      c.url ? `Страница: ${c.url}` : "",
    ]
      .filter(Boolean)
      .join("\n\n"),
    services: ["Жилое строительство", "Недвижимость"],
    specializations: ["Многоэтажное строительство", "Строительство домов"],
    priceRange: "mid",
    priceNote: "Уточняйте цены на house.kg или у компании",
    experience: 0,
    contacts: {
      phone: c.phone || c.phones[0],
      email: c.email || undefined,
      website: c.website || c.url || undefined,
    },
    location: { city: "Бишкек", lat: 42.8746, lng: 74.5698 },
    workArea: ["Кыргызстан"],
    hasLicense: false,
    highlights: ["house.kg"],
    sourceVerified: [c.source],
  };
}

const elitkaCompanies = merged.sources.elitka.builders.map(elitkaToCompany);
const houseKgCompanies = merged.sources.house_kg.companies.map(houseKgToCompany);

/** Все компании из `scraped/merged-companies.json` (elitka + house.kg). */
export const scrapedMergedCompanies: ConstructionCompany[] = [...elitkaCompanies, ...houseKgCompanies];
