/**
 * Cloudflare Pages Function: POST /api/correction
 * Опционально: TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID в настройках проекта.
 */

interface CorrectionBody {
  name?: string;
  email?: string;
  pageUrl?: string;
  sourceUrl?: string;
  details?: string;
}

function escapeTelegramHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function onRequestPost(context: {
  request: Request;
  env: { TELEGRAM_BOT_TOKEN?: string; TELEGRAM_CHAT_ID?: string };
}): Promise<Response> {
  const { request, env } = context;
  const token = env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = env.TELEGRAM_CHAT_ID?.trim();

  if (!token || !chatId) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: "Correction intake is not configured (set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID on Cloudflare Pages).",
      }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    );
  }

  let body: CorrectionBody;
  try {
    body = (await request.json()) as CorrectionBody;
  } catch {
    return new Response(JSON.stringify({ ok: false, error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const name = (body.name || "").trim().slice(0, 200);
  const email = (body.email || "").trim().slice(0, 200);
  const pageUrl = (body.pageUrl || "").trim().slice(0, 2000);
  const sourceUrl = (body.sourceUrl || "").trim().slice(0, 2000);
  const details = (body.details || "").trim().slice(0, 8000);

  if (!name || !email || !details) {
    return new Response(JSON.stringify({ ok: false, error: "name, email, details required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const text = [
    "<b>Заявка на правку каталога</b>",
    "",
    `<b>Имя:</b> ${escapeTelegramHtml(name)}`,
    `<b>Email:</b> ${escapeTelegramHtml(email)}`,
    pageUrl ? `<b>Страница:</b> ${escapeTelegramHtml(pageUrl)}` : "",
    sourceUrl ? `<b>Источник:</b> ${escapeTelegramHtml(sourceUrl)}` : "",
    "",
    "<b>Текст:</b>",
    escapeTelegramHtml(details),
  ]
    .filter(Boolean)
    .join("\n");

  const payload = {
    chat_id: chatId,
    text: text.length > 4000 ? `${text.slice(0, 3900)}…` : text,
    parse_mode: "HTML" as const,
    disable_web_page_preview: true,
  };

  const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!tgRes.ok) {
    const err = await tgRes.text();
    return new Response(JSON.stringify({ ok: false, error: err || "Telegram error" }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
