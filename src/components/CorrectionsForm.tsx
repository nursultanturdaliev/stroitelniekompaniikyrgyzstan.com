"use client";

import { useCallback, useState, type FormEvent } from "react";
import { CORRECTIONS_MAILTO } from "@/lib/siteContact";

function buildMailto(body: {
  name: string;
  email: string;
  pageUrl: string;
  sourceUrl: string;
  details: string;
}): string {
  const subject = encodeURIComponent("Правка каталога (застройщик / объект)");
  const text = encodeURIComponent(
    [
      `Имя: ${body.name}`,
      `Email для ответа: ${body.email}`,
      `Страница в каталоге: ${body.pageUrl || "(не указано)"}`,
      `Ссылка на первоисточник (официальный сайт, elitka, Минстрой): ${body.sourceUrl || "(не указано)"}`,
      "",
      "Суть запроса:",
      body.details || "(нет текста)",
    ].join("\n"),
  );
  const email = CORRECTIONS_MAILTO.replace(/^mailto:/, "");
  return `mailto:${email}?subject=${subject}&body=${text}`;
}

export default function CorrectionsForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pageUrl, setPageUrl] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [details, setDetails] = useState("");
  const [status, setStatus] = useState<"idle" | "sent" | "error" | "telegram_ok">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const onSubmitMailto = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      window.location.href = buildMailto({ name, email, pageUrl, sourceUrl, details });
    },
    [name, email, pageUrl, sourceUrl, details],
  );

  const onSubmitApi = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setStatus("idle");
      setErrorMsg("");
      try {
        const res = await fetch("/api/correction", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.slice(0, 200),
            email: email.slice(0, 200),
            pageUrl: pageUrl.slice(0, 2000),
            sourceUrl: sourceUrl.slice(0, 2000),
            details: details.slice(0, 8000),
          }),
        });
        const j = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
        if (res.ok && j.ok) {
          setStatus("telegram_ok");
          return;
        }
        setErrorMsg(j.error || `Ошибка ${res.status}`);
        setStatus("error");
      } catch {
        setErrorMsg("Сеть недоступна. Используйте отправку через почту.");
        setStatus("error");
      }
    },
    [name, email, pageUrl, sourceUrl, details],
  );

  return (
    <form className="space-y-4 text-sm">
      <label className="block">
        <span className="text-gray-600 block mb-1">Имя / компания</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2"
          required
        />
      </label>
      <label className="block">
        <span className="text-gray-600 block mb-1">Email для ответа</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2"
          required
        />
      </label>
      <label className="block">
        <span className="text-gray-600 block mb-1">URL страницы в каталоге</span>
        <input
          type="url"
          value={pageUrl}
          onChange={(e) => setPageUrl(e.target.value)}
          placeholder="https://stroitelniekompaniikyrgyzstan.com/projects/elitka-…"
          className="w-full rounded-lg border border-gray-200 px-3 py-2"
        />
      </label>
      <label className="block">
        <span className="text-gray-600 block mb-1">Ссылка на первоисточник</span>
        <input
          type="url"
          value={sourceUrl}
          onChange={(e) => setSourceUrl(e.target.value)}
          placeholder="elitka.kg, minstroy.gov.kg, сайт компании…"
          className="w-full rounded-lg border border-gray-200 px-3 py-2"
        />
      </label>
      <label className="block">
        <span className="text-gray-600 block mb-1">Что исправить</span>
        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          rows={5}
          className="w-full rounded-lg border border-gray-200 px-3 py-2"
          required
          placeholder="Конкретное поле и правильное значение по ссылке на первоисточник."
        />
      </label>

      {status === "telegram_ok" && (
        <p className="text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-lg p-3">Заявка отправлена. Спасибо.</p>
      )}
      {status === "error" && errorMsg && (
        <p className="text-amber-900 bg-amber-50 border border-amber-100 rounded-lg p-3">{errorMsg}</p>
      )}

      <div className="flex flex-wrap gap-3 pt-2">
        <button type="button" onClick={onSubmitMailto} className="btn-primary">
          Открыть почту (mailto)
        </button>
        <button type="button" onClick={onSubmitApi} className="btn-secondary">
          Отправить через сайт (если настроен Telegram)
        </button>
      </div>
      <p className="text-xs text-gray-500">
        Кнопка «через сайт» работает только если в Cloudflare Pages заданы секреты{" "}
        <code className="bg-gray-100 px-1 rounded">TELEGRAM_BOT_TOKEN</code> и{" "}
        <code className="bg-gray-100 px-1 rounded">TELEGRAM_CHAT_ID</code>. Иначе используйте почту.
      </p>
    </form>
  );
}
