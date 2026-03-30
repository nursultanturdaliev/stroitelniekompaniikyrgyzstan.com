import type { Metadata } from "next";
import CompaniesCatalog from "./CompaniesCatalog";

const siteUrl = "https://stroitelniekompaniikyrgyzstan.com";

const companiesIndexDescription =
  "Застройщики и подрядчики Кыргызстана: фильтры по типу, специализации, лицензии и городу. Агентства недвижимости — отдельный каталог. Новостройки elitka.kg — в разделе новостроек.";

export const metadata: Metadata = {
  title: "Каталог застройщиков и строительных компаний",
  description: companiesIndexDescription,
  openGraph: {
    title: "Застройщики и строительные компании Кыргызстана",
    description: companiesIndexDescription,
    url: `${siteUrl}/companies/`,
    type: "website",
  },
};

export default function CompaniesPage() {
  return <CompaniesCatalog />;
}
