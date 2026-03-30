import Link from "next/link";

const footerLinks = {
  catalog: [
    { href: "/projects/", label: "Новостройки" },
    { href: "/regions/", label: "Регионы" },
    { href: "/glossary/", label: "Словарь" },
    { href: "/companies/", label: "Все компании" },
    { href: "/types/", label: "Типы работ" },
    { href: "/types/doma/", label: "Частные дома" },
    { href: "/types/remont/", label: "Ремонт" },
    { href: "/negotiator/", label: "AI-переговорщик" },
  ],
  info: [
    { href: "/buyers/first-apartment/", label: "Первая квартира" },
    { href: "/buyers/location-environment/", label: "Место и среда" },
    { href: "/for-developers/", label: "Для застройщиков" },
    { href: "/methodology/", label: "Как мы собираем данные" },
    { href: "/guide/", label: "Как выбрать подрядчика" },
    { href: "/pricing/", label: "Ориентиры по ценам" },
    { href: "/faq/", label: "Частые вопросы" },
    { href: "/about/", label: "О проекте" },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-[var(--deep-navy)] text-white/80">
      <div className="container-custom section-padding pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-[var(--safety-orange)] rounded-sm flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <div>
                <span className="font-heading text-lg font-bold text-white leading-tight block">Стройка KG</span>
                <span className="text-[10px] text-white/50 uppercase tracking-widest leading-tight">Кыргызстан</span>
              </div>
            </div>
            <p className="text-sm text-white/60 leading-relaxed">
              Независимый каталог строительных, проектных и ремонтных компаний. Сравнивайте условия и принимайте решения
              на основе проверенных данных.
            </p>
          </div>

          <div>
            <h3 className="font-heading text-lg font-semibold text-white mb-4">Каталог</h3>
            <ul className="space-y-2">
              {footerLinks.catalog.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/60 hover:text-[var(--safety-orange)] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-heading text-lg font-semibold text-white mb-4">Информация</h3>
            <ul className="space-y-2">
              {footerLinks.info.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/60 hover:text-[var(--safety-orange)] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-heading text-lg font-semibold text-white mb-4">Контакты</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <svg
                  className="w-4 h-4 text-[var(--safety-orange)] flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm text-white/60">Кыргызстан</span>
              </li>
              <li className="flex items-start gap-2">
                <svg
                  className="w-4 h-4 text-[var(--safety-orange)] flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <span className="text-sm text-white/60">info@stroitelniekompaniikyrgyzstan.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-white/40">
              © {new Date().getFullYear()} Строительные компании Кыргызстана. Все права защищены.
            </p>
            <p className="text-xs text-white/30">
              Информация из открытых источников. Уточняйте детали у компаний перед договором.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
