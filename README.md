# Строительные компании Кыргызстана

Независимый каталог строительных, проектных и ремонтных компаний (Next.js 16, статический экспорт, Tailwind CSS v4).

## Разработка

```bash
npm install
npm run dev
```

Сборка статики:

```bash
npm run build
```

Локальный просмотр `out/`:

```bash
npm run preview
```

## AI-переговорщик (Cloudflare Pages + OpenAI)

Чат вызывает `POST /api/chat`. В режиме `next dev` этого маршрута нет — используйте:

```bash
npm run pages:dev
```

Перед этим задайте секрет **`OPENAI_API_KEY`** в настройках Cloudflare Pages (Production / Preview).

Функция: [`functions/api/chat.ts`](functions/api/chat.ts).

## Деплой на Cloudflare Pages

```bash
npm run deploy
```

Или подключите репозиторий к Pages: build command `npm run build`, output `out`. Каталог **`functions/`** в корне подхватывается автоматически.

## Данные: Elitka, House.kg, 2GIS

- Курируемый каталог на сайте: [`src/data/companies.ts`](src/data/companies.ts)
- **Сводная выгрузка** (застройщики с Elitka, бизнес-аккаунты House.kg, опционально 2GIS): [`scraped/merged-companies.json`](scraped/merged-companies.json)

Установка зависимостей для скрапера:

```bash
pip3 install -r scripts/requirements-scrape.txt
npm run scrape:sources
```

Параметры: `python3 scripts/scrape-all-sources.py --help` (например `--skip-house`, `--house-delay 0.2`).

Чтобы подтянуть карточки из **2GIS**, задайте `TWO_GIS_API_KEY` и запустите тот же скрипт — блок `sources["2gis"]` заполнится автоматически.

Отдельно только 2GIS (один запрос): [`scripts/scrape-2gis.py`](scripts/scrape-2gis.py).

## Ежедневная очередь контента

```bash
npm run daily:update
```

GitHub Actions: [`.github/workflows/daily-publishing.yml`](.github/workflows/daily-publishing.yml).

## Лицензия

Проект-шаблон каталога; наполнение и торговая марка — на вашей стороне.
