import type { Metadata } from "next";
import CompaniesCatalog from "./CompaniesCatalog";

export const metadata: Metadata = {
  title: "Каталог застройщиков и строительных компаний",
  description:
    "Застройщики и подрядчики: фильтры по типу, специализации, лицензии и городу. Агентства недвижимости — на отдельной странице.",
  openGraph: {
    title: "Застройщики и строительные компании Кыргызстана",
    description: "Поиск и фильтры: лицензия, услуги, отзывы, ориентиры по ценам.",
  },
};

export default function CompaniesPage() {
  return <CompaniesCatalog />;
}
