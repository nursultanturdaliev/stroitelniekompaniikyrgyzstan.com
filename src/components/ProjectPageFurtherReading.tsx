import Link from "next/link";

const links: { href: string; label: string; hint: string }[] = [
  { href: "/verify/", label: "Проверка за 5 минут", hint: "пошагово по официальным источникам" },
  { href: "/guide/", label: "Практический гид и реестры", hint: "куда смотреть после каталога" },
  { href: "/glossary/", label: "Словарь терминов", hint: "паспорт объекта, статусы и др." },
  { href: "/buyers/location-environment/", label: "Место и среда", hint: "что учесть при выборе локации в КР" },
];

export default function ProjectPageFurtherReading() {
  return (
    <section className="mb-6 rounded-xl border border-gray-100 bg-white p-5" aria-labelledby="project-further-reading">
      <h2 id="project-further-reading" className="font-heading text-base font-semibold text-[var(--charcoal)] mb-3">
        Дальше почитать
      </h2>
      <ul className="space-y-2 text-sm">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="font-medium text-[var(--steel-blue)] hover:underline">
              {l.label}
            </Link>
            <span className="text-gray-500"> — {l.hint}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
