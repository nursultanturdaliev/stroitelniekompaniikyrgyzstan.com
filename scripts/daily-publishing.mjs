import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const CONTENT_OPS_DIR = path.join(ROOT, "content-ops");
const DATA_DIR = path.join(ROOT, "src", "data");

const LOG_PATH = path.join(CONTENT_OPS_DIR, "publishing-log.json");
const TODO_PATH = path.join(CONTENT_OPS_DIR, "publishing-todo.json");
const DAILY_STATUS_PATH = path.join(CONTENT_OPS_DIR, "daily-plan-status.md");
const DAILY_UPDATES_PATH = path.join(DATA_DIR, "dailyUpdates.json");

const WEBSITE_ITEMS_LIMIT = 120;
const TODO_ITEMS_LIMIT = 30;

const RECURRING_TODO = [
  {
    title: "Поиск строительных компаний на 2GIS.kg — запросы «строительная компания», «застройщик», «ремонт квартир» (Бишкек)",
    category: "Исследование",
    priority: "high",
  },
  {
    title: "Обновить контакты и рейтинги существующих карточек каталога",
    category: "Обновление данных",
    priority: "medium",
  },
  {
    title: "Добавить новую компанию в src/data/companies.ts с полем sourceVerified",
    category: "Наполнение сайта",
    priority: "medium",
  },
  {
    title: "Проверить лицензии СЛР / СРО по публичным реестрам для одной карточки",
    category: "Верификация",
    priority: "high",
  },
  {
    title: "Обогатить карточку: проекты, сметные ориентиры, ссылки на отзывы",
    category: "Обогащение",
    priority: "medium",
  },
];

async function ensureDirectories() {
  await mkdir(CONTENT_OPS_DIR, { recursive: true });
  await mkdir(DATA_DIR, { recursive: true });
}

async function readJsonOrDefault(filePath, defaultValue) {
  try {
    const raw = await readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch {
    return defaultValue;
  }
}

async function writeJson(filePath, value) {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function makeId(seed) {
  return createHash("sha256").update(seed).digest("hex").slice(0, 18);
}

function normalizeTitle(value) {
  return value
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, "")
    .replace(/[^a-zа-яёА-ЯЁ0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function taskSignature(task) {
  return `${task.category}|${normalizeTitle(task.title ?? "")}`;
}

function byPriorityThenDate(a, b) {
  const priorityScore = { high: 3, medium: 2, low: 1 };
  const left = priorityScore[a.priority] ?? 0;
  const right = priorityScore[b.priority] ?? 0;
  if (left !== right) return right - left;
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

function recurringTasks(nowIso) {
  return RECURRING_TODO.map((task) => ({
    id: `recurring-${makeId(task.title)}`,
    createdAt: nowIso,
    status: "pending",
    priority: task.priority,
    category: task.category,
    title: task.title,
    sourceName: "Внутренний",
    sourceUrl: "",
    url: "",
  }));
}

async function main() {
  await ensureDirectories();

  const nowIso = new Date().toISOString();
  const log = await readJsonOrDefault(LOG_PATH, {
    lastRunAt: "",
    totalPublished: 0,
    items: [],
    runs: [],
  });
  const todo = await readJsonOrDefault(TODO_PATH, {
    updatedAt: "",
    tasks: [],
  });
  const dailyUpdates = await readJsonOrDefault(DAILY_UPDATES_PATH, {
    updatedAt: "",
    items: [],
  });

  const existingPendingTasks = (todo.tasks ?? []).filter((task) => task.status === "pending");
  const mergedTasks = [...existingPendingTasks, ...recurringTasks(nowIso)];

  const dedupedTasks = [];
  const seenTaskSignatures = new Set();
  for (const task of mergedTasks) {
    const signature = taskSignature(task);
    if (seenTaskSignatures.has(signature)) continue;
    seenTaskSignatures.add(signature);
    dedupedTasks.push(task);
  }

  dedupedTasks.sort(byPriorityThenDate);

  const nextTodo = {
    updatedAt: nowIso,
    tasks: dedupedTasks.slice(0, TODO_ITEMS_LIMIT),
  };

  const nextLog = {
    lastRunAt: nowIso,
    totalPublished: log.totalPublished ?? 0,
    items: (log.items ?? []).slice(0, 500),
    runs: [
      {
        date: nowIso.slice(0, 10),
        executedAt: nowIso,
        publishedCount: 0,
        queuedCount: nextTodo.tasks.length,
      },
      ...(log.runs ?? []),
    ].slice(0, 120),
  };

  const nextDailyUpdates = {
    updatedAt: nowIso,
    items: (dailyUpdates.items ?? []).slice(0, WEBSITE_ITEMS_LIMIT),
  };

  await writeJson(LOG_PATH, nextLog);
  await writeJson(TODO_PATH, nextTodo);
  await writeJson(DAILY_UPDATES_PATH, nextDailyUpdates);

  const statusMd = [
    "# Ежедневный статус (строительный каталог)",
    "",
    `- Выполнено: ${nowIso}`,
    `- Задач в очереди: ${nextTodo.tasks.length}`,
    "",
    "## Задачи на сегодня",
    ...nextTodo.tasks.slice(0, 8).map((task) => `- [${task.priority}] ${task.title}`),
    "",
    "## Примечание",
    "Исследование и наполнение выполняются вручную или с помощью AI в редакторе.",
    "Скрипт ведёт очередь задач и лог.",
    "",
  ].join("\n");

  await writeFile(DAILY_STATUS_PATH, statusMd, "utf8");

  console.log(`Ежедневное обновление выполнено. Задач: ${nextTodo.tasks.length}.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
