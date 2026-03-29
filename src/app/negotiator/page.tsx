import { Suspense } from "react";
import type { Metadata } from "next";
import NegotiatorChat from "@/components/NegotiatorChat";

export const metadata: Metadata = {
  title: "AI-переговорщик",
  description:
    "Подготовка к переговорам со строительной компанией: вопросы, аргументы по цене и условиям. Работает с OpenAI на Cloudflare Pages.",
  openGraph: {
    title: "AI-переговорщик для стройки и ремонта",
    description: "Советы по переговорам с подрядчиком на основе данных каталога.",
  },
};

function ChatFallback() {
  return (
    <div className="section-padding container-custom max-w-3xl">
      <p className="text-[var(--slate-blue)]">Загрузка…</p>
    </div>
  );
}

export default function NegotiatorPage() {
  return (
    <section className="section-padding bg-[var(--soft-white)]">
      <div className="container-custom">
        <h1 className="font-heading text-3xl md:text-4xl font-bold text-[var(--charcoal)] mb-2 text-center">
          AI-переговорщик
        </h1>
        <p className="text-[var(--slate-blue)] text-center max-w-2xl mx-auto mb-10">
          Выберите компанию из каталога, опишите проект. Ассистент подскажет, как обсудить цену, смету, сроки и договор —
          без замены живого диалога с подрядчиком.
        </p>
        <Suspense fallback={<ChatFallback />}>
          <NegotiatorChat />
        </Suspense>
      </div>
    </section>
  );
}
