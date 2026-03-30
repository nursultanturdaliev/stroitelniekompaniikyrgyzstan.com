# Чеклист после новой выгрузки (scrape)

Используйте после обновления `scraped/merged-companies.json`, чтобы сайт и журнал изменений оставались согласованными.

1. **Сохранить предыдущую версию**  
   Скопируйте текущий `scraped/merged-companies.json` в `scraped/merged-companies.prev.json` **до** замены файлом новой выгрузки (или переименуйте старый артефакт сюда).

2. **Сгенерировать diff для UI**  
   ```bash
   npm run merge:diff
   ```  
   Скрипт `scripts/diff-merged-companies.py` запишет сводку в `src/data/mergeChangelog.json`. Закоммитьте этот файл вместе с обновлённым `merged-companies.json` (или зафиксируйте артефакт в CI и вручную перенесите JSON в репозиторий — как у вас принято).

3. **Паспорта Минстроя (рекомендуется периодически)**  
   Полный прогон долгий; для выборки или теста:
   ```bash
   python3 scripts/scrape-all-sources.py --passport-scrape --passport-max 20
   ```  
   Только обновление паспортов по уже готовому merge:
   ```bash
   npm run scrape:passports
   ```  
   (см. `package.json` и docstring в `scripts/scrape-all-sources.py`).

4. **Сводка качества выгрузки (опционально)**  
   ```bash
   npm run data:stats
   ```  
   Обновит `src/data/dataQualityStats.json` для блоков на `/updates/` и `/methodology/`.

5. **Сборка сайта**  
   ```bash
   npm run build
   ```  
   Убедитесь, что статические маршруты объектов успевают собраться в разумное время.

6. **Публичная лента**  
   При необходимости обновите человекочитаемые заметки на `/updates/` (если ведёте их отдельно от автоматического changelog).
