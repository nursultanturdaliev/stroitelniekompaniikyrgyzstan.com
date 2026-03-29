import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "О проекте",
  description:
    "Независимый каталог строительных компаний Кыргызстана — прозрачность данных, гайды и AI-помощник для переговоров.",
};

export default function AboutPage() {
  return (
    <article className="section-padding bg-[var(--soft-white)]">
      <div className="container-custom max-w-3xl">
        <h1 className="font-heading text-3xl md:text-4xl font-bold text-[var(--charcoal)] mb-6">О проекте</h1>
        <div className="prose prose-lg max-w-none text-[var(--slate-blue)] space-y-4">
          <p>
            Мы собираем открытые данные о строительных, проектных и ремонтных компаниях Кыргызстана, чтобы пользователям
            было проще сравнить условия и задать правильные вопросы до подписания договора.
          </p>
          <p>
            Каталог не заменяет юридическую консультацию и не гарантирует качество работ — цель в том, чтобы снизить
            информационный шум и указать проверяемые источники (сайт, 2ГИС, тендеры).
          </p>
          <p>
            AI-переговорщик генерирует сценарии диалога и аргументы на основе вашего описания проекта и публичных данных
            о компании. Это вспомогательный инструмент: итоговые условия всегда фиксируйте в письменном договоре.
          </p>
        </div>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link href="/companies/" className="btn-primary">
            Каталог
          </Link>
          <Link href="/guide/" className="btn-secondary">
            Гид по выбору
          </Link>
        </div>
      </div>
    </article>
  );
}
