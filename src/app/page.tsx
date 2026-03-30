"use client";

import Link from "next/link";
import Hero from "@/components/Hero";
import SectionTitle from "@/components/SectionTitle";
import CompanyCard from "@/components/CompanyCard";
import TypeCard from "@/components/TypeCard";
import DailyUpdatesFeed from "@/components/DailyUpdatesFeed";
import { companies, isRealEstateAgency, isRepairCompany } from "@/data/companies";
import { constructionTypes } from "@/data/constructionTypes";
import { quickFacts, processSteps } from "@/data/practicalInfo";
import dailyUpdatesData from "@/data/dailyUpdates.json";

export default function Home() {
  const featured = companies.filter((c) => !isRealEstateAgency(c) && !isRepairCompany(c)).slice(0, 6);
  const typePreview = constructionTypes.slice(0, 3);

  return (
    <>
      <Hero />

      <section className="relative -mt-8 z-20 pb-8">
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickFacts.map((fact) => (
              <div
                key={fact.label}
                className="bg-white rounded-xl p-5 shadow-lg border border-gray-50 text-center"
              >
                <span className="text-2xl md:text-3xl font-heading font-bold text-[var(--steel-blue)]">
                  {fact.value}
                </span>
                <span className="block text-sm text-[var(--slate-blue)] mt-1">{fact.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding bg-[var(--soft-white)]">
        <div className="container-custom">
          <SectionTitle
            subtitle="Каталог"
            title="Застройщики и подрядчики"
            description="Строительные компании и застройщики — услуги, лицензии по данным источников, ориентиры по ценам. Агентства недвижимости — в отдельном разделе."
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map((company, index) => (
              <CompanyCard key={company.id} company={company} featured={index === 0} />
            ))}
          </div>
          <div className="text-center mt-10 flex flex-wrap gap-4 justify-center">
            <Link href="/companies/" className="btn-primary">
              Все компании
            </Link>
            <Link href="/agencies/" className="btn-secondary">
              Агентства недвижимости
            </Link>
            <Link href="/remont/" className="btn-secondary">
              Ремонт
            </Link>
          </div>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="container-custom">
          <SectionTitle
            subtitle="Типы работ"
            title="Выберите сегмент"
            description="Краткие гайды: что входит в работы, какие вопросы задать и какие риски учесть"
          />
          <div className="grid md:grid-cols-3 gap-6">
            {typePreview.map((t) => (
              <TypeCard key={t.id} type={t} />
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/types/" className="btn-secondary">
              Все типы работ
            </Link>
          </div>
        </div>
      </section>

      <DailyUpdatesFeed updatedAt={dailyUpdatesData.updatedAt} items={dailyUpdatesData.items} />

      <section className="section-padding bg-[var(--soft-white)]">
        <div className="container-custom">
          <SectionTitle
            subtitle="Процесс"
            title="Как принять взвешенное решение"
            description="Четыре шага до подписания договора с подрядчиком"
          />
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {processSteps.map((s) => (
              <div key={s.step} className="bg-white rounded-xl p-6 border border-gray-100">
                <span className="text-3xl font-heading font-bold text-[var(--safety-orange)]">{s.step}</span>
                <h3 className="font-heading text-lg font-semibold text-[var(--charcoal)] mt-2 mb-2">{s.title}</h3>
                <p className="text-sm text-[var(--slate-blue)]">{s.body}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10 flex flex-wrap justify-center gap-4">
            <Link href="/guide/" className="btn-primary">
              Полный гид
            </Link>
            <Link href="/negotiator/" className="btn-secondary">
              Подготовка к переговорам
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
