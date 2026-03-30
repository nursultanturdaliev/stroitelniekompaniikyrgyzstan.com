import Link from "next/link";

export default function ProjectCounterpartyHint({
  builderName,
  builderSlug,
  hasCompanyProfile,
}: {
  builderName: string;
  builderSlug: string;
  hasCompanyProfile: boolean;
}) {
  return (
    <section className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
      <h2 className="font-heading text-lg font-semibold text-[var(--charcoal)] mb-2">Кого проверять</h2>
      <p className="text-sm text-[var(--slate-blue)] mb-3">
        В переговорах вы часто общаетесь с <strong>офисом продаж</strong> или агентом. Стороной по договору купли-продажи или
        долевого участия может быть <strong>другое юридическое лицо</strong>, чем бренд на баннере. Перед подписанием
        сопоставьте название в договоре с карточкой застройщика и реестрами.
      </p>
      <p className="text-sm text-[var(--slate-blue)] mb-4">
        В каталоге объект привязан к застройщику: <strong>{builderName}</strong>. Это ориентир по данным elitka.kg, не
        замена проверки контрагента.
      </p>
      <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
        {hasCompanyProfile ? (
          <li>
            <Link href={`/companies/${builderSlug}/`} className="text-[var(--steel-blue)] font-medium hover:underline">
              Карточка «{builderName}» в каталоге
            </Link>
          </li>
        ) : (
          <li className="text-gray-500 text-sm">Профиля компании в каталоге пока нет — проверяйте реестры по названию и ИНН.</li>
        )}
        <li>
          <Link href="/verify/" className="text-[var(--steel-blue)] font-medium hover:underline">
            Проверка за 5 минут
          </Link>
        </li>
        <li>
          <Link href="/glossary/" className="text-[var(--steel-blue)] font-medium hover:underline">
            Словарь: застройщик, паспорт…
          </Link>
        </li>
        <li>
          <Link href="/buyers/sales-visit/" className="text-[var(--steel-blue)] font-medium hover:underline">
            Чеклист визита в офис
          </Link>
        </li>
      </ul>
    </section>
  );
}
