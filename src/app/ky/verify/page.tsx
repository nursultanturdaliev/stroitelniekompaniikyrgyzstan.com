import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Текшерүү (кыскача)",
  description:
    "Жаңы үй сатып алуучулар үчүн: Минстрой паспорту, реестрлер, elitka. Юридикалык кеңеш эмес.",
};

const steps = [
  {
    title: "Объекттин паспорту (Минстрой)",
    body: "Эгер шилтеме бар болсо, minstroy.gov.kg сайтындагы расмий баракчаны ачыңыз. Каталогдогу снимок жардамчы гана.",
  },
  {
    title: "Лицензиялар жана «кара тизме»",
    body: "Компанияны Минстройдун ачык реестринде издеңиз. Каталогдогу дал келүүлөр автоматтык — текшерүүнү сайтта кайталаңыз.",
  },
  {
    title: "Elitka.kg",
    body: "Пландаштырылган мөөнөт жана бааларды паспорт жана сатуучу менен салышыңыз.",
  },
  {
    title: "Келишим",
    body: "Келишимдин долбоору жана төлөм графигин сураңыз. Маанилүү нерселерди расмий документте гана бекитүү керек.",
  },
];

export default function KyVerifyPage() {
  return (
    <article className="section-padding bg-[var(--soft-white)] min-h-[60vh]" lang="ky">
      <div className="container-custom max-w-3xl">
        <p className="text-sm text-[var(--slate-blue)] mb-6">
          <Link href="/verify/" className="text-[var(--steel-blue)] hover:underline">
            Орусча толук версия
          </Link>
        </p>
        <h1 className="font-heading text-3xl font-bold text-[var(--charcoal)] mb-3">Жаңы үй: кыска текшерүү</h1>
        <p className="text-[var(--slate-blue)] mb-8 text-sm">
          Бул юридикалык кеңеш эмес. Акыркы маалымат үчүн мамлекеттик сайттарды колдонуңуз.
        </p>
        <ol className="space-y-6">
          {steps.map((s, i) => (
            <li key={s.title} className="bg-white rounded-xl border border-gray-100 p-5">
              <span className="text-sm font-bold text-[var(--steel-blue)]">{i + 1}</span>
              <h2 className="font-heading text-lg font-semibold text-[var(--charcoal)] mt-1 mb-2">{s.title}</h2>
              <p className="text-sm text-[var(--slate-blue)]">{s.body}</p>
            </li>
          ))}
        </ol>
        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href="https://minstroy.gov.kg"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary text-sm"
          >
            minstroy.gov.kg
          </a>
          <Link href="/projects/" className="btn-secondary text-sm">
            Жаңы үйлөр каталогу
          </Link>
          <Link href="/ky/methodology/" className="btn-secondary text-sm">
            Маалымат кантип чогулат
          </Link>
        </div>
      </div>
    </article>
  );
}
