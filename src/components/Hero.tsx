import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative min-h-[85vh] flex items-center bg-[var(--deep-navy)] overflow-hidden">
      <div className="absolute inset-0 opacity-[0.06]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h60v60H0z' fill='none' stroke='%23E8713A' stroke-width='1'/%3E%3C/svg%3E")`,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="container-custom relative z-10 py-20">
        <div className="max-w-3xl">
          <span className="inline-block text-[var(--safety-orange)] text-sm font-semibold uppercase tracking-widest mb-6 animate-fade-in">
            Новостройки и застройщики Кыргызстана
          </span>

          <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight animate-fade-in-up">
            Проверьте новостройку и застройщика
            <span className="text-[var(--safety-orange)]"> за ~10 минут</span>
          </h1>

          <p className="text-lg md:text-xl text-white/70 mb-10 max-w-2xl leading-relaxed animate-fade-in-up animation-delay-200">
            Каталог объектов из открытых данных, ссылки на паспорт Минстроя и чеклист самопроверки — без обещаний «лучшей
            сделки». Дальше — гайды и подготовка к переговорам.
          </p>

          <div className="flex flex-wrap gap-4 animate-fade-in-up animation-delay-400">
            <Link href="/verify/" className="btn-primary text-base py-3 px-8">
              Начать проверку
            </Link>
            <Link
              href="/projects/"
              className="btn-secondary border-white/30 text-white hover:bg-white/10 hover:border-white/50 text-base py-3 px-8"
            >
              Каталог новостроек
            </Link>
            <Link
              href="/methodology/"
              className="text-sm font-medium text-white/80 hover:text-white self-center underline-offset-4 hover:underline"
            >
              Как мы собираем данные
            </Link>
            <Link
              href="/buyers/first-apartment/"
              className="text-sm font-medium text-white/80 hover:text-white self-center underline-offset-4 hover:underline"
            >
              Первая квартира
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 animate-fade-in-up animation-delay-600">
            {[
              { value: "5+", label: "Компаний (старт)" },
              { value: "5", label: "Типов работ" },
              { value: "4", label: "Ценовых сегмента" },
              { value: "24/7", label: "Доступ к гайдам" },
            ].map((stat) => (
              <div key={stat.label} className="text-center md:text-left">
                <span className="text-2xl md:text-3xl font-heading font-bold text-[var(--safety-orange)]">
                  {stat.value}
                </span>
                <span className="block text-xs text-white/50 mt-1">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute right-0 top-0 bottom-0 w-1/3 hidden xl:block">
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--deep-navy)] to-transparent z-10" />
        <div className="absolute inset-0 bg-[var(--safety-orange)]/5" />
      </div>
    </section>
  );
}
