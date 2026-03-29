"use client";

interface DailyUpdateItem {
  id: string;
  date: string;
  title: string;
  summary: string;
  category: string;
  sourceName: string;
  sourceUrl: string;
  url: string;
}

interface DailyUpdatesFeedProps {
  updatedAt: string;
  items: DailyUpdateItem[];
}

const categoryColors: Record<string, string> = {
  "Новости индустрии": "bg-amber-100 text-amber-800",
  Советы: "bg-blue-100 text-blue-700",
  "Новые компании": "bg-green-100 text-green-700",
  Тендеры: "bg-purple-100 text-purple-700",
};

export default function DailyUpdatesFeed({ updatedAt, items }: DailyUpdatesFeedProps) {
  if (!items || items.length === 0) {
    return (
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="text-center">
            <span className="text-[var(--safety-orange)] text-sm font-semibold uppercase tracking-widest">Новости</span>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-[var(--charcoal)] mt-2 mb-4">
              Обновления рынка строительства
            </h2>
            <p className="text-[var(--slate-blue)] max-w-2xl mx-auto">
              Скоро здесь появятся новости о строительных компаниях, тендерах и изменениях цен в Кыргызстане.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section-padding bg-white">
      <div className="container-custom">
        <div className="text-center mb-12">
          <span className="text-[var(--safety-orange)] text-sm font-semibold uppercase tracking-widest">Новости</span>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-[var(--charcoal)] mt-2 mb-4">
            Обновления рынка строительства
          </h2>
          {updatedAt && (
            <p className="text-xs text-[var(--slate-blue)]">
              Обновлено:{" "}
              {new Date(updatedAt).toLocaleDateString("ru-RU", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          )}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((item) => (
            <a
              key={item.id}
              href={item.url || "#"}
              className="block p-5 rounded-xl border border-gray-100 hover:border-[var(--steel-blue)]/30 hover:shadow-md transition-all text-left"
            >
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${categoryColors[item.category] || "bg-gray-100 text-gray-700"}`}
                >
                  {item.category}
                </span>
                <span className="text-xs text-[var(--slate-blue)]">{item.date}</span>
              </div>
              <h3 className="font-heading font-semibold text-lg text-[var(--charcoal)] mb-2">{item.title}</h3>
              <p className="text-sm text-[var(--slate-blue)] line-clamp-2">{item.summary}</p>
              {item.sourceName && (
                <p className="text-xs text-[var(--slate-blue)] mt-3">Источник: {item.sourceName}</p>
              )}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
