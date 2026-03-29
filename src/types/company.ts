import type { BusinessContacts } from "@/types/businessContacts";

export type CompanyType =
  | "Строительная компания"
  | "Застройщик"
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
  | "Дорожное строительство";

export type PriceRangeTier = "budget" | "mid" | "premium" | "luxury";

export interface CompletedProject {
  title: string;
  description: string;
  images: string[];
  area?: string;
  type: string;
  year?: number;
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
  licenseInfo?: string;
  teamSize?: string;
  highlights: string[];
  workHours?: string;
  twogisBranchesUrl?: string;
  sourceVerified: string[];
}
