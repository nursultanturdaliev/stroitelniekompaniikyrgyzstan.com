import type { Metadata } from "next";
import CompaniesCatalog from "../companies/CompaniesCatalog";

export const metadata: Metadata = {
  title: "Агентства недвижимости Кыргызстана",
  description:
    "Риелторы и агентства (в т.ч. house.kg): фильтры по услугам, рейтингу, городу. Застройщиков смотрите в каталоге компаний.",
  openGraph: {
    title: "Агентства недвижимости Кыргызстана",
    description: "Каталог агентств и риелторов. Данные из открытых источников.",
  },
};

export default function AgenciesPage() {
  return <CompaniesCatalog variant="agencies" />;
}
