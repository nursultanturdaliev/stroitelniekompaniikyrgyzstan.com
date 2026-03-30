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

  const onSubmitMailto = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      window.location.href = buildMailto({ name, email, pageUrl, sourceUrl, details });
    },
    [name, email, pageUrl, sourceUrl, details],
  );

  return (
    <form className="space-y-4 text-sm" onSubmit={onSubmitMailto}>
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

      <div className="pt-2">
        <button type="submit" className="btn-primary">
          Открыть почту с заполненным письмом
        </button>
      </div>
      <p className="text-xs text-gray-500">
        Заявка уходит через почтовый клиент на устройстве (mailto). Мы не храним форму на сервере.
      </p>
    </form>
  );
}
