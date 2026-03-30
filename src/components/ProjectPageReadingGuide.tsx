/**
 * Native <details> — без клиентского JS: как устроена страница объекта и зачем несколько блоков.
 */
export default function ProjectPageReadingGuide() {
  return (
    <details className="mb-6 rounded-xl border border-gray-200 bg-white/80 open:shadow-sm">
      <summary className="cursor-pointer rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--charcoal)] hover:bg-gray-50 marker:text-[var(--steel-blue)]">
        Как читать эту страницу
      </summary>
      <div className="px-3 pb-3 pt-0 text-sm text-[var(--slate-blue)] space-y-3 border-t border-gray-100 mt-1 pt-3">
        <ol className="list-decimal pl-5 space-y-2">
          <li>
            Цифры и статус — из <strong>каталога elitka.kg</strong> на дату выгрузки. Это ориентир, не договор и не выписка из
            реестра.
          </li>
          <li>
            Решение о покупке всегда опирайте на <strong>паспорт объекта на minstroy.gov.kg</strong> и документы застройщика —
            ссылки в карточке лишь подсказка, где искать.
          </li>
          <li>
            Блоки «AI-мнение», аналитика и чеклист — <strong>сжатые подсказки для сравнения</strong>, не юридическая и не
            экологическая экспертиза.
          </li>
        </ol>
        <p className="text-xs text-gray-500">
          Несколько блоков рядом — намеренно: разные углы (кратко / детали / место / документы). Ни один не заменяет
          проверку первоисточников.
        </p>
      </div>
    </details>
  );
}
