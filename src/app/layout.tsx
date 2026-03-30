import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const siteUrl = "https://stroitelniekompaniikyrgyzstan.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Новостройки и застройщики Кыргызстана — проверка и каталог",
    template: "%s | Стройка KG",
  },
  description:
    "Проверьте новостройку и застройщика за ~10 минут: каталог объектов, паспорт Минстроя, гайды. Открытые источники — elitka.kg, реестры, без платного ранжирования.",
  keywords:
    "новостройки Бишкек, застройщики Кыргызстан, паспорт объекта Минстрой, строительные компании Бишкек, ремонт квартир Бишкек, строительство домов Кыргызстан",
  authors: [{ name: "Строительные компании Кыргызстана" }],
  openGraph: {
    title: "Новостройки и застройщики — каталог и проверка",
    description:
      "Каталог новостроек из открытых данных, чеклист проверки и ссылки на первоисточники. Гайды и AI-помощник для переговоров.",
    type: "website",
    locale: "ru_KG",
    siteName: "Строительные компании Кыргызстана",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "Стройка KG — новостройки и проверка",
    description: "Проверка новостройки и застройщика, каталог объектов и гайды для покупателя.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="h-full antialiased">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Строительные компании Кыргызстана",
              url: siteUrl,
              description: "Независимый каталог строительных компаний Кыргызстана",
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Строительные компании Кыргызстана",
              url: siteUrl,
              inLanguage: "ru",
              potentialAction: {
                "@type": "SearchAction",
                target: `${siteUrl}/companies/?q={search_term_string}`,
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-[var(--soft-white)]">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
