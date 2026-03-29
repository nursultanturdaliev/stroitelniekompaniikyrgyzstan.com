import type { Metadata } from "next";
import CompaniesCatalog from "./CompaniesCatalog";

export const metadata: Metadata = {
  title: "Каталог строительных компаний",
  description:
    "Фильтры по типу компании, специализации, лицензии, городу и ценовому сегменту. Сравнение подрядчиков Кыргызстана.",
  openGraph: {
    title: "Каталог строительных компаний Кыргызстана",
    description: "Поиск и фильтры: лицензия, услуги, отзывы, ориентиры по ценам.",
  },
};

export default function CompaniesPage() {
  return <CompaniesCatalog />;
}
