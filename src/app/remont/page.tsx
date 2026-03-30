import type { Metadata } from "next";
import CompaniesCatalog from "../companies/CompaniesCatalog";

export const metadata: Metadata = {
  title: "Ремонтные компании Кыргызстана",
  description:
    "Каталог компаний по ремонту квартир и помещений: фильтры по городу, рейтингу, лицензии. Застройщиков и агентства — в других разделах.",
  openGraph: {
    title: "Ремонтные компании Кыргызстана",
    description: "Поиск подрядчиков по ремонту. Данные из открытых источников.",
  },
};

export default function RemontCompaniesPage() {
  return <CompaniesCatalog variant="repair" />;
}
