import type { Metadata } from "next";
import Link from "next/link";
import { registryBlacklistSection, registryGuideDisclaimer, registryGuideSections } from "@/data/registryGuide";

export const metadata: Metadata = {
  title: "Проверка застройщика и объекта за 5 минут",
  description:
    "Краткий чеклист: паспорт объекта, реестры Минстроя, каталог elitka.kg. Не юридическая консультация.",
  openGraph: {
    title: "Проверка новостройки за 5 минут",
    description: "Пошаговый ориентир по официальным источникам КР.",
  },
};

const steps = [
  {
    title: "Паспорт объекта на сайте Минстроя",
    body: "Если у объекта есть ссылка «Паспорт объекта» — откройте именно официальную страницу minstroy.gov.kg и прочитайте статус, сроки и участников. Снимок текста в каталоге — вспомогательный; юридическую силу имеет сайт ведомства.",
    links: [
      { href: "https://minstroy.gov.kg", label: "minstroy.gov.kg" },
      { href: "/guide/", label: "Гид: лицензия и паспорт" },
    ],
  },
  {
    title: "Реестры лицензий и чёрный список",
    body: "Найдите компанию в открытых реестрах Минстроя по названию и при возможности по ИНН. Совпадения в нашем каталоге сделаны автоматически — перепроверьте на сайте ведомства.",
    links: [
      { href: "https://minstroy.gov.kg/ru/license/reestr", label: "Реестр лицензий" },
      { href: registryBlacklistSection.ctaHref, label: registryBlacklistSection.ctaLabel },
      { href: "/blacklist/", label: "Раздел «Чёрный список» в каталоге" },
    ],
  },
  {
    title: "Каталог новостроек (elitka.kg)",
    body: "Сравните плановые сроки и цены в открытой карточке с тем, что видите в паспорте и в переговорах с отделом продаж.",
    links: [
      { href: "/projects/", label: "Каталог объектов на сайте" },
      { href: "https://elitka.kg", label: "elitka.kg" },
    ],
  },
  {
    title: "Договор и условия",
    body: "Запросите проект договора, график платежей и фиксируйте устные обещания письменно только через официальные документы. Каталог не подсказывает, какой договор «правильный».",
    links: [
      { href: "/negotiator/", label: "AI-переговорщик (подготовка к разговору)" },
      { href: "/faq/", label: "FAQ" },
    ],
  },
];

export default function VerifyPage() {
  return (
    <article className="section-padding bg-[var(--soft-white)] min-h-[60vh]">
      <div className="container-custom max-w-3xl">
        <nav className="text-sm text-[var(--slate-blue)] mb-6">
          <Link href="/" className="hover:text-[var(--steel-blue)]">
            Главная
          </Link>
          <span className="mx-2">/</span>
          <span className="text-[var(--charcoal)]">Проверка за 5 минут</span>
        </nav>

        <p className="text-sm text-[var(--slate-blue)] mb-4">
          <Link href="/ky/verify/" className="text-[var(--steel-blue)] hover:underline" lang="ky">
            Версия на кыргызском (кратко)
          </Link>
        </p>
        <h1 className="font-heading text-3xl md:text-4xl font-bold text-[var(--charcoal)] mb-3">Проверка за 5 минут</h1>
        <p className="text-[var(--slate-blue)] mb-8">
          Ориентир для покупателя новостройки: куда зайти и что сверить. Это не юридическая консультация и не замена
          проверке по первоисточникам.
        </p>

        <ol className="space-y-8 mb-10">
          {steps.map((s, i) => (
            <li key={s.title} className="bg-white rounded-xl border border-gray-100 p-5 md:p-6">
              <span className="text-sm font-bold text-[var(--steel-blue)]">Шаг {i + 1}</span>
              <h2 className="font-heading text-xl font-semibold text-[var(--charcoal)] mt-1 mb-2">{s.title}</h2>
              <p className="text-sm text-[var(--slate-blue)] mb-4">{s.body}</p>
              <ul className="flex flex-wrap gap-3">
                {s.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-sm font-medium text-[var(--steel-blue)] hover:underline"
                      {...(l.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>

        <div className="rounded-xl border border-amber-100 bg-amber-50/80 p-5 mb-10">
          <h2 className="font-heading text-lg font-semibold text-[var(--charcoal)] mb-2">{registryGuideDisclaimer.title}</h2>
          <p className="text-sm text-[var(--slate-blue)] mb-3">{registryGuideDisclaimer.body}</p>
          <a
            href={registryGuideDisclaimer.officialUrl}
            className="text-sm font-medium text-[var(--steel-blue)] hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Официальный сайт Минстроя
          </a>
        </div>

        <section className="mb-8">
          <h2 className="font-heading text-lg font-semibold text-[var(--charcoal)] mb-3">Ещё из гида</h2>
          <ul className="space-y-2 text-sm text-[var(--slate-blue)]">
            {registryGuideSections.map((sec) => (
              <li key={sec.id}>
                <Link href={`/guide/#${sec.id}`} className="text-[var(--steel-blue)] hover:underline font-medium">
                  {sec.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <div className="flex flex-wrap gap-3">
          <Link href="/projects/" className="btn-primary">
            Каталог новостроек
          </Link>
          <Link href="/companies/" className="btn-secondary">
            Компании
          </Link>
        </div>
      </div>
    </article>
  );
}
