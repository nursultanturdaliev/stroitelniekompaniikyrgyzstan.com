import type { Metadata } from "next";
import CompaniesCatalog from "./CompaniesCatalog";

export const metadata: Metadata = {
  title: "Каталог застройщиков и агентств недвижимости",
  description:
    "Фильтры по типу (строительная компания, застройщик, агентство недвижимости), специализации, лицензии и городу. Данные из открытых источников.",
  openGraph: {
    title: "Каталог застройщиков и агентств недвижимости Кыргызстана",
    description: "Поиск и фильтры: лицензия, услуги, отзывы, ориентиры по ценам.",
  },
};

export default function CompaniesPage() {
  return <CompaniesCatalog />;
}
