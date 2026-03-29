/**
 * Cloudflare Pages Function: POST /api/chat
 * Requires secret OPENAI_API_KEY in Pages project settings.
 */

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface RequestBody {
  messages?: ChatMessage[];
  companyContext?: string;
}

const SYSTEM_PROMPT = `Ты опытный советник по переговорам со строительными и ремонтными подрядчиками в Кыргызстане.
Отвечай на русском языке. Будь нейтральным, практичным и честным: не обещай от имени компании, не выдумывай цены, если их нет в контексте.
Помогай пользователю: формулировать вопросы, оспаривать завышенные позиции, обсуждать график оплаты, фиксацию брендов в смете, гарантии и акты скрытых работ.
Если данных мало — так и скажи и предложи, что уточнить у подрядчика.
Не давай юридически обязывающих формулировок; при сложных случаях советуй обратиться к юристу.`;

export async function onRequestPost(context: {
  request: Request;
  env: { OPENAI_API_KEY?: string };
}): Promise<Response> {
  const { request, env } = context;

  if (!env.OPENAI_API_KEY) {
    return new Response(JSON.stringify({ error: "OPENAI_API_KEY is not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const messages = body.messages?.filter((m) => (m.role === "user" || m.role === "assistant") && m.content?.trim()) ?? [];
  if (messages.length === 0) {
    return new Response(JSON.stringify({ error: "messages required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (messages.length > 40) {
    return new Response(JSON.stringify({ error: "too many messages" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const companyContext = (body.companyContext || "").slice(0, 12000);
  const systemContent = `${SYSTEM_PROMPT}\n\n--- Данные о компании (из каталога, могут быть неполными) ---\n${companyContext || "(не указано)"}`;

  const openaiMessages: ChatMessage[] = [{ role: "system", content: systemContent }, ...messages];

  const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      stream: true,
      messages: openaiMessages,
      temperature: 0.6,
      max_tokens: 2048,
    }),
  });

  if (!openaiRes.ok) {
    const errText = await openaiRes.text();
    return new Response(JSON.stringify({ error: errText || "OpenAI error" }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(openaiRes.body, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
