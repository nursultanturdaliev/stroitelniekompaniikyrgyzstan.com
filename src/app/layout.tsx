import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const siteUrl = "https://stroitelniekompaniikyrgyzstan.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Строительные компании Кыргызстана — каталог и сравнение",
    template: "%s | Строительные компании Кыргызстана",
  },
  description:
    "Честный каталог строительных, проектных и ремонтных компаний Кыргызстана: услуги, цены, лицензии, отзывы. Гайды и AI-помощник для переговоров с подрядчиком.",
  keywords:
    "строительные компании Бишкек, застройщики Кыргызстан, ремонт квартир Бишкек, строительство домов Кыргызстан, проектная организация Бишкек",
  authors: [{ name: "Строительные компании Кыргызстана" }],
  openGraph: {
    title: "Строительные компании Кыргызстана — каталог и сравнение",
    description:
      "Каталог подрядчиков с фильтрами, проверенными источниками и советами по выбору. AI-переговорщик для подготовки к диалогу о цене.",
    type: "website",
    locale: "ru_KG",
    siteName: "Строительные компании Кыргызстана",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "Строительные компании Кыргызстана",
    description: "Каталог строительных и ремонтных компаний с гайдами и AI-помощником.",
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
