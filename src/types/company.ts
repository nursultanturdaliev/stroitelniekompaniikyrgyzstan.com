import type { BusinessContacts } from "@/types/businessContacts";

export type CompanyType =
  | "Строительная компания"
  | "Застройщик"
  | "Агентство недвижимости"
  | "Проектная организация"
  | "Ремонтная компания"
  | "Дорожное строительство";

export type ServiceCategory =
  | "Строительство домов"
  | "Многоэтажное строительство"
  | "Ремонт квартир"
  | "Проектирование"
  | "Фундаментные работы"
  | "Кровельные работы"
  | "Фасадные работы"
  | "Инженерные сети"
  | "Благоустройство"
  | "Дорожное строительство"
  | "Риелторские услуги"
  | "Аренда жилья"
  | "Продажа вторичного жилья";

export type PriceRangeTier = "budget" | "mid" | "premium" | "luxury";

export interface CompletedProject {
  title: string;
  description: string;
  images: string[];
  area?: string;
  type: string;
  year?: number;
  /** Стабильный ключ для списков (например elitka-{id}) */
  key?: string;
  elitkaObjectId?: number;
  /** Человекочитаемый статус по данным elitka.kg */
  elitkaStatusLabel?: string;
  plannedStartDisplay?: string;
  plannedFinishDisplay?: string;
  initialPlannedFinishDisplay?: string;
  plannedDurationMonths?: number;
  scheduleSlipNote?: string;
  /** Ссылка на паспорт объекта на сайте Минстроя */
  passportUrl?: string;
}

export interface ConstructionCompany {
  id: string;
  slug: string;
  name: string;
  type: CompanyType[];
  tagline: string;
  description: string;
  logo?: string;
  coverImage?: string;
  services: string[];
  specializations: ServiceCategory[];
  priceRange: PriceRangeTier;
  priceNote?: string;
  priceDetails?: { service: string; price: string }[];
  experience: number;
  foundedYear?: number;
  projectCount?: number;
  completedProjects?: CompletedProject[];
  contacts: BusinessContacts;
  location: { city: string; address?: string; lat: number; lng: number };
  workArea: string[];
  rating?: number;
  reviewCount?: number;
  hasLicense: boolean;
  /** Совпадение с чёрным списком (ур. 6) реестра Минстроя по данным автоматического сопоставления — не юридический вывод */
  minstroyBlacklistWarning?: boolean;
  licenseInfo?: string;
  teamSize?: string;
  highlights: string[];
  workHours?: string;
  twogisBranchesUrl?: string;
  sourceVerified: string[];
}
