"use client";

export default function SalesVisitPrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="btn-primary print-hidden">
      Версия для печати
    </button>
  );
}
