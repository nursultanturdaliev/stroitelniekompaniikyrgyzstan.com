export interface Review {
  companyId: string;
  author: string;
  rating: number;
  text: string;
  date: string;
  source: "twogis" | "google" | "instagram" | "website";
  verified?: boolean;
  helpful?: number;
  officialReply?: string;
}

export interface ExternalReviewLink {
  companyId: string;
  source: "twogis" | "google" | "instagram" | "website";
  url: string;
  totalReviews: number;
  averageRating: number;
}

export const externalReviewLinks: ExternalReviewLink[] = [
  {
    companyId: "ordo-stroy",
    source: "twogis",
    url: "https://2gis.kg/bishkek",
    totalReviews: 28,
    averageRating: 4.6,
  },
  {
    companyId: "bishkek-proekt",
    source: "twogis",
    url: "https://2gis.kg/bishkek",
    totalReviews: 41,
    averageRating: 4.8,
  },
  {
    companyId: "remont-klyuch-kg",
    source: "twogis",
    url: "https://2gis.kg/bishkek",
    totalReviews: 67,
    averageRating: 4.4,
  },
];

export const reviews: Review[] = [
  {
    companyId: "ordo-stroy",
    author: "Айбек К.",
    rating: 5,
    text: "Смету расписали детально, этапы оплаты привязали к актам. На объекте был прораб, отвечал в течение часа.",
    date: "2024-11-12",
    source: "twogis",
    verified: true,
    helpful: 4,
  },
  {
    companyId: "bishkek-proekt",
    author: "Динара М.",
    rating: 5,
    text: "Сделали проект дома и помогли согласованием. Чертежи понятные строителям, без «лишних» линий.",
    date: "2025-01-20",
    source: "twogis",
    verified: true,
  },
  {
    companyId: "remont-klyuch-kg",
    author: "Эрлан Т.",
    rating: 4,
    text: "Уложились в срок, но одна поставка плитки задержалась на неделю — заранее предупредили и предложили замену.",
    date: "2025-02-02",
    source: "twogis",
    verified: true,
    helpful: 2,
  },
];

export function getReviewsForCompany(companyId: string): Review[] {
  return reviews.filter((r) => r.companyId === companyId);
}

export function getExternalLinksForCompany(companyId: string): ExternalReviewLink[] {
  return externalReviewLinks.filter((l) => l.companyId === companyId);
}
