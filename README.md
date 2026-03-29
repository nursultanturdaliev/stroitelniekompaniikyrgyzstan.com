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

## Данные и 2GIS

- Карточки: [`src/data/companies.ts`](src/data/companies.ts)
- Выгрузка из 2GIS: [`scripts/scrape-2gis.py`](scripts/scrape-2gis.py) (нужен `TWO_GIS_API_KEY`)

```bash
export TWO_GIS_API_KEY="..."
python3 scripts/scrape-2gis.py --query "строительная компания" --city "Бишкек" --out scraped-companies.json
```

Без ключа скрипт создаёт пример JSON.

## Ежедневная очередь контента

```bash
npm run daily:update
```

GitHub Actions: [`.github/workflows/daily-publishing.yml`](.github/workflows/daily-publishing.yml).

## Лицензия

Проект-шаблон каталога; наполнение и торговая марка — на вашей стороне.
