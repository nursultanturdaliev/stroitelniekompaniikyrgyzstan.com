"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { companies } from "@/data/companies";

type Role = "user" | "assistant";

export interface ChatMessage {
  role: Role;
  content: string;
}

function buildCompanyContext(slug: string | null): string {
  if (!slug) return "";
  const c = companies.find((x) => x.slug === slug);
  if (!c) return "";
  return [
    `Компания: ${c.name}`,
    `Тип: ${c.type.join(", ")}`,
    `Теглайн: ${c.tagline}`,
    `Услуги: ${c.services.join("; ")}`,
    `Специализации: ${c.specializations.join("; ")}`,
    `Ценовой сегмент: ${c.priceRange}`,
    c.priceNote ? `Ориентир цены: ${c.priceNote}` : "",
    c.priceDetails?.length ? `Детали цен: ${c.priceDetails.map((p) => `${p.service}: ${p.price}`).join("; ")}` : "",
    `Лицензия (по данным карточки): ${c.hasLicense ? "да" : "нет"}`,
    c.licenseInfo || "",
    `Город/зона: ${c.location.city}; ${c.workArea.join(", ")}`,
    `Опыт: ${c.experience} лет, проектов (указано): ${c.projectCount ?? "—"}`,
  ]
    .filter(Boolean)
    .join("\n");
}

export default function NegotiatorChat() {
  const searchParams = useSearchParams();
  const [companySlug, setCompanySlug] = useState<string>("");
  const [projectBrief, setProjectBrief] = useState("");
  const [started, setStarted] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const c = searchParams.get("company");
    if (c) setCompanySlug(c);
  }, [searchParams]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getContext = useCallback(() => {
    const ctx = buildCompanyContext(companySlug || null);
    if (ctx) return ctx;
    return "Компания не выбрана из каталога — опирайся на описание проекта пользователя и общие рыночные ориентиры по Кыргызстану (Бишкек и регионы).";
  }, [companySlug]);

  const runStream = useCallback(
    async (apiMessages: { role: Role; content: string }[]) => {
      setLoading(true);
      setError(null);
      setMessages((m) => [...m, { role: "assistant", content: "" }]);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: apiMessages,
            companyContext: getContext(),
          }),
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `Ошибка ${res.status}`);
        }

        if (!res.body) throw new Error("Нет тела ответа");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let assistantContent = "";

        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const data = trimmed.slice(5).trim();
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data) as {
                choices?: { delta?: { content?: string } }[];
              };
              const piece = parsed.choices?.[0]?.delta?.content;
              if (piece) {
                assistantContent += piece;
                setMessages((m) => {
                  const next = [...m];
                  const last = next[next.length - 1];
                  if (last?.role === "assistant") {
                    next[next.length - 1] = { role: "assistant", content: assistantContent };
                  }
                  return next;
                });
              }
            } catch {
              /* incomplete JSON */
            }
          }
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Ошибка запроса");
        setMessages((m) => m.filter((x, i) => !(i === m.length - 1 && x.role === "assistant" && x.content === "")));
      } finally {
        setLoading(false);
      }
    },
    [getContext],
  );

  const startSession = useCallback(async () => {
    const companyName = companies.find((x) => x.slug === companySlug)?.name || "подрядчика (уточните компанию в каталоге)";
    const firstUser = [
      `Я планирую обсудить условия с ${companyName}.`,
      projectBrief ? `Кратко о проекте: ${projectBrief}` : "",
      "Помоги подготовиться к переговорам: список вопросов, аргументы за снижение цены или лучшие условия (сроки, график оплаты, фиксация брендов в смете), на что смотреть в договоре. Пиши по-русски, нейтрально и практично.",
    ]
      .filter(Boolean)
      .join("\n");

    const userMessage: ChatMessage = { role: "user", content: firstUser };
    setStarted(true);
    setMessages([userMessage]);
    await runStream([userMessage]);
  }, [companySlug, projectBrief, runStream]);

  function sendUserMessage() {
    if (!input.trim() || loading) return;
    const userMessage: ChatMessage = { role: "user", content: input.trim() };
    setInput("");

    setMessages((prev) => {
      const next = [...prev, userMessage];
      const apiThread = next.filter((m) => m.content.trim());
      void runStream(apiThread);
      return next;
    });
  }

  return (
    <div className="max-w-3xl mx-auto">
      {!started ? (
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--charcoal)] mb-2">Компания из каталога</label>
            <select
              value={companySlug}
              onChange={(e) => setCompanySlug(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">— Выберите —</option>
              {companies.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-[var(--slate-blue)] mt-1">
              Или откройте карточку компании и нажмите «AI-переговорщик» — подставится из URL.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--charcoal)] mb-2">О проекте (кратко)</label>
            <textarea
              value={projectBrief}
              onChange={(e) => setProjectBrief(e.target.value)}
              rows={4}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              placeholder="Например: ремонт 72 м², черновая+чистовая, бюджет до X, срок 3 месяца"
            />
          </div>
          <p className="text-xs text-[var(--slate-blue)]">
            Локально <code className="bg-gray-100 px-1 rounded">next dev</code> не подключает Cloudflare Functions. Для
            чата: <code className="bg-gray-100 px-1 rounded">npm run pages:dev</code> или деплой на Cloudflare Pages с
            секретом OPENAI_API_KEY.
          </p>
          <button type="button" onClick={() => void startSession()} disabled={loading} className="btn-primary disabled:opacity-50">
            {loading ? "Запрос…" : "Начать"}
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 flex flex-col h-[min(70vh,640px)]">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-xl px-4 py-2 text-sm ${
                    m.role === "user"
                      ? "bg-[var(--steel-blue)] text-white"
                      : "bg-[var(--soft-white)] text-[var(--charcoal)] border border-gray-100"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.content || (loading && i === messages.length - 1 ? "…" : "")}</p>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
          {error && <p className="px-4 text-sm text-red-600">{error}</p>}
          <div className="p-4 border-t border-gray-100 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && void sendUserMessage()}
              placeholder="Ваш вопрос…"
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
            <button type="button" onClick={() => void sendUserMessage()} disabled={loading} className="btn-primary py-2 px-4">
              Отправить
            </button>
          </div>
          <div className="px-4 pb-4">
            <Link href="/companies/" className="text-sm text-[var(--steel-blue)] hover:underline">
              ← К каталогу
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
