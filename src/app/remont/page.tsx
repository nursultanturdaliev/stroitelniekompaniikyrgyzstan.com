import type { Metadata } from "next";
import CompaniesCatalog from "../companies/CompaniesCatalog";

const siteUrl = "https://stroitelniekompaniikyrgyzstan.com";

const remontDescription =
  "Каталог компаний по ремонту квартир и помещений: фильтры по городу, рейтингу, лицензии. Застройщиков и агентства — в других разделах. Новостройки — в каталоге elitka.";

export const metadata: Metadata = {
  title: "Ремонтные компании Кыргызстана",
  description: remontDescription,
  openGraph: {
    title: "Ремонтные компании Кыргызстана",
    description: remontDescription,
    url: `${siteUrl}/remont/`,
    type: "website",
  },
};

export default function RemontCompaniesPage() {
  return <CompaniesCatalog variant="repair" />;
}
