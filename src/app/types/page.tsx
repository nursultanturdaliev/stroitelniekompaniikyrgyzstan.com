import type { Metadata } from "next";
import Link from "next/link";
import SectionTitle from "@/components/SectionTitle";
import TypeCard from "@/components/TypeCard";
import { constructionTypes } from "@/data/constructionTypes";

export const metadata: Metadata = {
  title: "Типы строительных работ",
  description: "Дома, многоэтажка, ремонт, проектирование, дороги — что учесть при выборе подрядчика в Кыргызстане.",
};

export default function TypesPage() {
  return (
    <section className="section-padding bg-[var(--soft-white)]">
      <div className="container-custom">
        <SectionTitle
          subtitle="Справочник"
          title="Типы работ"
          description="Краткие гайды по каждому сегменту: типовые работы, вопросы подрядчику и риски."
        />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {constructionTypes.map((t) => (
            <TypeCard key={t.id} type={t} />
          ))}
        </div>
        <p className="text-center mt-10 text-sm text-[var(--slate-blue)]">
          Дальше —{" "}
          <Link href="/companies/" className="text-[var(--steel-blue)] font-medium hover:underline">
            каталог компаний
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
