import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Маалыматтар кантип чогулат",
  description: "Elitka, Минстрой, ачык булактар. Кыргызча кыскача.",
};

export default function KyMethodologyPage() {
  return (
    <article className="section-padding bg-[var(--soft-white)] min-h-[60vh]" lang="ky">
      <div className="container-custom max-w-3xl">
        <p className="text-sm text-[var(--slate-blue)] mb-6">
          <Link href="/methodology/" className="text-[var(--steel-blue)] hover:underline">
            Орусча толук версия
          </Link>
        </p>
        <h1 className="font-heading text-3xl font-bold text-[var(--charcoal)] mb-4">Маалыматтар кантип чогулат</h1>
        <div className="space-y-6 text-sm text-[var(--slate-blue)]">
          <section className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="font-heading text-lg font-semibold text-[var(--charcoal)] mb-2">Elitka.kg</h2>
            <p>
              Жаңы үйлөрдүн ачык маалыматы API жана каталог аркылуу алынат. Баа жана мөөнөттөр сатуучу менен дайыма
              ырасталсын.
            </p>
          </section>
          <section className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="font-heading text-lg font-semibold text-[var(--charcoal)] mb-2">Минстрой</h2>
            <p>
              Объекттин паспорту — мамлекеттик сайттагы баракча. Сайттагы «снимок» акыркы эмес болушу мүмкүн; расмий текст
              үчүн minstroy.gov.kg ачыңыз.
            </p>
          </section>
          <section className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="font-heading text-lg font-semibold text-[var(--charcoal)] mb-2">Башка булактар</h2>
            <p>
              House.kg, 2GIS жана сайттардан алынган маалымат автоматтык дал келүүлөр менен чектелет. Шек саноодо — расмий
              шилтемени колдонуңуз.
            </p>
          </section>
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/ky/verify/" className="btn-primary text-sm">
            Текшерүү
          </Link>
          <Link href="/updates/" className="btn-secondary text-sm">
            Жаңылоолор
          </Link>
          <Link href="/corrections/" className="btn-secondary text-sm">
            Тууралоо өтүнүчү
          </Link>
        </div>
      </div>
    </article>
  );
}
