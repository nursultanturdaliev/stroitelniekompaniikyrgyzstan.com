import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { companies, getCompanyBySlug } from "@/data/companies";
import { getExternalLinksForCompany, getReviewsForCompany } from "@/data/reviews";
import ContactCard from "@/components/ContactCard";
import ReviewSection from "@/components/ReviewSection";
import PriceRangeTag from "@/components/PriceRangeTag";
import ProjectCard from "@/components/ProjectCard";

const siteUrl = "https://stroitelniekompaniikyrgyzstan.com";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return companies.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const company = getCompanyBySlug(slug);
  if (!company) return { title: "Компания не найдена" };
  const primaryType = company.type[0] ?? "Компания";
  return {
    title: `${company.name} — ${primaryType.toLowerCase()}`,
    description: company.tagline,
    openGraph: {
      title: company.name,
      description: company.tagline,
      url: `${siteUrl}/companies/${company.slug}/`,
    },
  };
}

export default async function CompanyPage({ params }: Props) {
  const { slug } = await params;
  const company = getCompanyBySlug(slug);
  if (!company) notFound();

  const reviews = getReviewsForCompany(company.id);
  const externalLinks = getExternalLinksForCompany(company.id);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: company.name,
    description: company.tagline,
    url: company.contacts.website || siteUrl,
    telephone: company.contacts.phone,
    address: company.location.address
      ? {
          "@type": "PostalAddress",
          streetAddress: company.location.address,
          addressLocality: company.location.city,
          addressCountry: "KG",
        }
      : undefined,
    geo: {
      "@type": "GeoCoordinates",
      latitude: company.location.lat,
      longitude: company.location.lng,
    },
    aggregateRating:
      company.rating && company.reviewCount
        ? {
            "@type": "AggregateRating",
            ratingValue: company.rating,
            reviewCount: company.reviewCount,
          }
        : undefined,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="bg-[var(--deep-navy)] py-10">
        <div className="container-custom">
          <nav className="text-sm text-white/60 mb-4">
            <Link href="/" className="hover:text-white">
              Главная
            </Link>
            <span className="mx-2">/</span>
            <Link href="/companies/" className="hover:text-white">
              Компании
            </Link>
            <span className="mx-2">/</span>
            <span className="text-white">{company.name}</span>
          </nav>
          <div className="flex flex-wrap items-start gap-4 justify-between">
            <div>
              <h1 className="font-heading text-3xl md:text-4xl font-bold text-white mb-2">{company.name}</h1>
              <p className="text-white/80 max-w-2xl">{company.tagline}</p>
              <div className="flex flex-wrap gap-2 mt-4">
                <PriceRangeTag priceRange={company.priceRange} size="md" />
                {company.hasLicense ? (
                  <span className="text-sm px-3 py-1 rounded-full bg-[var(--forest-green)]/30 text-white">Лицензия</span>
                ) : (
                  <span className="text-sm px-3 py-1 rounded-full bg-white/10 text-white/80">Лицензия не указана</span>
                )}
              </div>
            </div>
            <Link href={`/negotiator/?company=${company.slug}`} className="btn-primary whitespace-nowrap">
              AI-переговорщик
            </Link>
          </div>
        </div>
      </section>

      <section className="section-padding bg-[var(--soft-white)]">
        <div className="container-custom grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-xl p-6 border border-gray-100">
              <h2 className="font-heading text-xl font-semibold text-[var(--charcoal)] mb-4">О компании</h2>
              <div className="prose prose-sm max-w-none text-[var(--slate-blue)] whitespace-pre-line">{company.description}</div>
              <div className="mt-4 flex flex-wrap gap-2">
                {company.highlights.map((h) => (
                  <span key={h} className="text-xs px-2 py-1 rounded-full bg-[var(--warm-beige)] text-[var(--slate-blue)]">
                    {h}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-100">
              <h2 className="font-heading text-xl font-semibold text-[var(--charcoal)] mb-4">Услуги</h2>
              <ul className="grid sm:grid-cols-2 gap-2 text-sm text-[var(--slate-blue)]">
                {company.services.map((s) => (
                  <li key={s} className="flex items-center gap-2">
                    <span className="text-[var(--safety-orange)]">•</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>

            {company.priceDetails && company.priceDetails.length > 0 && (
              <div className="bg-white rounded-xl p-6 border border-gray-100">
                <h2 className="font-heading text-xl font-semibold text-[var(--charcoal)] mb-4">Ориентиры по ценам</h2>
                <p className="text-sm text-[var(--slate-blue)] mb-4">
                  Уточняйте актуальные цены в офисе. Ниже — данные из карточки компании.
                </p>
                <table className="w-full text-sm">
                  <tbody>
                    {company.priceDetails.map((row) => (
                      <tr key={row.service} className="border-b border-gray-100">
                        <td className="py-2 text-[var(--charcoal)]">{row.service}</td>
                        <td className="py-2 text-right font-medium text-[var(--steel-blue)]">{row.price}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {company.priceNote && <p className="mt-3 text-sm text-[var(--safety-orange)]">{company.priceNote}</p>}
              </div>
            )}

            {company.completedProjects && company.completedProjects.length > 0 && (
              <div>
                <h2 className="font-heading text-xl font-semibold text-[var(--charcoal)] mb-4">Проекты</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {company.completedProjects.map((p) => (
                    <ProjectCard key={p.title} project={p} />
                  ))}
                </div>
              </div>
            )}

            <ReviewSection
              reviews={reviews}
              externalLinks={externalLinks}
              companyName={company.name}
              rating={company.rating}
              reviewCount={company.reviewCount}
            />
          </div>

          <div className="space-y-6">
            <ContactCard contacts={company.contacts} name={company.name} />

            <div className="bg-white rounded-xl p-6 border border-gray-100 text-sm text-[var(--slate-blue)]">
              <h3 className="font-heading text-lg font-semibold text-[var(--charcoal)] mb-3">Реквизиты и проверка</h3>
              <ul className="space-y-2">
                <li>
                  <span className="font-medium text-[var(--charcoal)]">Город:</span> {company.location.city}
                </li>
                {company.location.address && (
                  <li>
                    <span className="font-medium text-[var(--charcoal)]">Адрес:</span> {company.location.address}
                  </li>
                )}
                {company.workHours && (
                  <li>
                    <span className="font-medium text-[var(--charcoal)]">Часы:</span> {company.workHours}
                  </li>
                )}
                {company.teamSize && (
                  <li>
                    <span className="font-medium text-[var(--charcoal)]">Команда:</span> {company.teamSize}
                  </li>
                )}
                {company.licenseInfo && (
                  <li className="whitespace-pre-line">
                    <span className="font-medium text-[var(--charcoal)]">Лицензия и реестры:</span>{" "}
                    {company.licenseInfo}
                  </li>
                )}
                <li>
                  <span className="font-medium text-[var(--charcoal)]">Источники:</span> {company.sourceVerified.join(", ")}
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-100">
              <h3 className="font-heading text-lg font-semibold text-[var(--charcoal)] mb-2">Зона работ</h3>
              <p className="text-sm text-[var(--slate-blue)]">{company.workArea.join(", ")}</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
