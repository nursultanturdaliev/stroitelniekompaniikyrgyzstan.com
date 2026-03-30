#!/usr/bin/env node
/**
 * Еженедельный (или ручной) дайджест по src/data/mergeChangelog.json в Telegram.
 *
 * Секреты (GitHub Actions / локально):
 *   TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
 *
 * Если секретов нет или в changelog нет активности — выход 0 без отправки.
 *
 * Запуск: node scripts/send-merge-digest.mjs [path/to/mergeChangelog.json]
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const file = resolve(root, process.argv[2] || "src/data/mergeChangelog.json");

let data;
try {
  data = JSON.parse(readFileSync(file, "utf8"));
} catch (e) {
  console.error("Не удалось прочитать mergeChangelog:", e.message);
  process.exit(1);
}

const s = data.summary || {};
const total = (s.added || 0) + (s.removed || 0) + (s.changed || 0);
if (total === 0) {
  console.log("В changelog нет активности — сообщение не отправляем.");
  process.exit(0);
}

const token = (process.env.TELEGRAM_BOT_TOKEN || "").trim();
const chatId = (process.env.TELEGRAM_CHAT_ID || "").trim();

if (!token || !chatId) {
  console.error("TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID not set — пропуск дайджеста.");
  process.exit(0);
}

const lines = [
  "Дайджест выгрузки каталога (авто)",
  "",
  `+${s.added || 0} новых объектов в выгрузке`,
  `−${s.removed || 0} исчезло из выгрузки`,
  `~${s.changed || 0} объектов с изменениями полей`,
  "",
  `Дата выгрузки (новая): ${data.toScrapedAt || "—"}`,
  `Дифф сгенерирован: ${data.generatedAt || "—"}`,
  "",
  "Сайт: https://stroitelniekompaniikyrgyzstan.com/updates/",
];

const text = lines.join("\n");

const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    chat_id: chatId,
    text: text.slice(0, 4090),
    disable_web_page_preview: true,
  }),
});

if (!res.ok) {
  console.error(await res.text());
  process.exit(1);
}

console.log("Дайджест отправлен в Telegram.");
