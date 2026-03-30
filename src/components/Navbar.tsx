"use client";

import { useState } from "react";
import Link from "next/link";

const navLinks = [
  { href: "/blacklist/", label: "Чёрный список" },
  { href: "/projects/", label: "Новостройки" },
  { href: "/regions/", label: "Регионы" },
  { href: "/companies/", label: "Компании" },
  { href: "/agencies/", label: "Агентства" },
  { href: "/remont/", label: "Ремонт" },
  { href: "/types/", label: "Типы работ" },
  { href: "/negotiator/", label: "AI-переговорщик" },
  { href: "/guide/", label: "Гид" },
  { href: "/glossary/", label: "Словарь" },
  { href: "/updates/", label: "Изменения" },
  { href: "/corrections/", label: "Правка" },
  { href: "/verify/", label: "Проверка" },
  { href: "/pricing/", label: "Цены" },
  { href: "/faq/", label: "FAQ" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-white/95 backdrop-blur-sm border-b border-[var(--warm-beige)] sticky top-0 z-50">
      <div className="container-custom">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[var(--steel-blue)] rounded-sm flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-heading text-lg font-bold text-[var(--charcoal)] leading-tight">
                Стройка KG
              </span>
              <span className="text-[10px] text-[var(--slate-blue)] uppercase tracking-widest leading-tight">
                Каталог
              </span>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-[var(--slate-blue)] hover:text-[var(--safety-orange)] transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <Link href="/companies/" className="btn-primary text-sm py-2 px-5">
              Найти компанию
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden p-2 text-[var(--charcoal)]"
            aria-label="Открыть меню"
          >
            {isOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="lg:hidden bg-white border-t border-[var(--warm-beige)]">
          <div className="container-custom py-4 space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="block py-2 text-sm font-medium text-[var(--slate-blue)] hover:text-[var(--safety-orange)] transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/companies/"
              onClick={() => setIsOpen(false)}
              className="block btn-primary text-sm py-2 px-5 text-center mt-3"
            >
              Найти компанию
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
