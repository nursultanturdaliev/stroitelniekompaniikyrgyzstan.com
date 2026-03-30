import type { Metadata } from "next";
import CompaniesCatalog from "../companies/CompaniesCatalog";

const siteUrl = "https://stroitelniekompaniikyrgyzstan.com";

const agenciesDescription =
  "Агентства недвижимости и риелторы Кыргызстана: фильтры по услугам, рейтингу, городу. Застройщиков и новостройки — в каталоге компаний и разделе новостроек.";

export const metadata: Metadata = {
  title: "Агентства недвижимости Кыргызстана",
  description: agenciesDescription,
  openGraph: {
    title: "Агентства недвижимости Кыргызстана",
    description: agenciesDescription,
    url: `${siteUrl}/agencies/`,
    type: "website",
  },
};

export default function AgenciesPage() {
  return <CompaniesCatalog variant="agencies" />;
}
