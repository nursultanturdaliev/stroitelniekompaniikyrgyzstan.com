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

/** Плоские факты по объекту из детального ответа elitka.kg (после slim в merged JSON). */
export interface ElitkaCharacteristicRow {
  name: string;
  value: string;
}

export interface ElitkaRelatedBuildingRef {
  id: number;
  slug: string;
  title: string;
  address?: string;
  gosstroy_registry?: string;
}

export type ElitkaRoomCountKey =
  | "one_room_flats"
  | "one_room_studio_flats"
  | "two_room_flats"
  | "two_room_studio_flats"
  | "three_room_flats"
  | "three_room_studio_flats"
  | "four_room_flats"
  | "four_room_studio_flats"
  | "five_room_flats"
  | "five_room_studio_flats";

export interface ElitkaObjectFacts {
  slug?: string;
  cityId?: number;
  districtId?: number;
  subdistrictNames?: string[];
  blocksCount?: number;
  ceilingHeight?: string | number;
  floorCount?: number;
  entrancesCount?: number;
  objectClass?: string | number;
  totalFlats?: number;
  totalArea?: string | number;
  landArea?: string | number;
  heat?: string;
  constructionTechnology?: string;
  wallMaterial?: string;
  facade?: string;
  undergroundParking?: string | number | boolean;
  surfaceParking?: string | number | boolean;
  initialPayment?: string | number;
  installmentPeriod?: string | number;
  finishInstallmentDate?: string;
  finishQuarter?: string | number;
  finishYear?: number;
  finishMonth?: number;
  reliabilityIndex?: string | number;
  qualityScore?: string | number;
  rating?: number;
  reviewsCount?: number;
  viewCount?: number;
  callCount?: number;
  showCount?: number;
  isPromoted?: boolean;
  docPresentation?: string;
  docStateExpertise?: string;
  docMasterPlan?: string;
  docObjectPassport?: string;
  docTypicalFloorPlan?: string;
  docArea?: string;
  detailPriceUsd?: string | number;
  detailPriceKgs?: string | number;
  createdAt?: string;
  updatedAt?: string;
  characteristics?: ElitkaCharacteristicRow[];
  relatedBuildings?: ElitkaRelatedBuildingRef[];
  constructionProgress?: Array<Record<string, string | number | null | undefined>>;
  apartments?: Array<Record<string, string | number | null | undefined>>;
  roomCounts?: Partial<Record<ElitkaRoomCountKey, number>>;
  labels?: unknown;
}

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
  /** Сырой код статуса строительства из API elitka (для агрегатов на карточке компании). */
  elitkaConstructionStatusCode?: string;
  plannedStartDisplay?: string;
  plannedFinishDisplay?: string;
  initialPlannedFinishDisplay?: string;
  plannedDurationMonths?: number;
  scheduleSlipNote?: string;
  /** Ссылка на паспорт объекта на сайте Минстроя */
  passportUrl?: string;
  /** Поля со страницы паспорта (если есть снимок в merged JSON после scrape) */
  passportSnapshot?: {
    fetchedAt?: string;
    httpStatus?: number | null;
    parseError?: string | null;
    fields: Record<string, string>;
  };
  /** Структурированные поля из детальной карточки elitka.kg (если были в выгрузке). */
  elitkaFacts?: ElitkaObjectFacts;
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
  /** Число строк реестра Минстроя, сопоставленных по названию/ИНН при сборке выгрузки (не официальное заключение). */
  minstroyRegistryMatchCount?: number;
  licenseInfo?: string;
  teamSize?: string;
  highlights: string[];
  workHours?: string;
  twogisBranchesUrl?: string;
  sourceVerified: string[];
  /** Автоснимок с официального сайта (тот же домен); см. merged `company_website_snapshots`. */
  websiteSnapshot?: CompanyWebsiteSnapshot;
}

/** Снимок HTML с сайта компании (как passportSnapshot — не замена первоисточника). */
export interface CompanyWebsiteSnapshot {
  requestedUrl: string;
  finalUrl?: string;
  fetchedAt?: string;
  httpStatus?: number | null;
  parseError?: string | null;
  fields: Record<string, string>;
  sameAs?: string[];
  /** Доп. страницы того же сайта (/contacts, /about), если сработал второй заход */
  extraPagesFetched?: string[];
}
