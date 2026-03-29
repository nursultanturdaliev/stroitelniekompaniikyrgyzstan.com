"use client";

import { useState } from "react";
import type { Review, ExternalReviewLink } from "@/data/reviews";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-4 h-4 ${star <= rating ? "text-[var(--safety-orange)]" : "text-gray-200"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function SourceBadge({ source }: { source: Review["source"] }) {
  const config = {
    twogis: { label: "2ГИС", color: "bg-green-100 text-green-700" },
    google: { label: "Google", color: "bg-blue-100 text-blue-700" },
    instagram: { label: "Instagram", color: "bg-pink-100 text-pink-700" },
    website: { label: "Сайт", color: "bg-purple-100 text-purple-700" },
  };
  const { label, color } = config[source];
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${color}`}>{label}</span>;
}

function formatDate(dateStr: string): string {
  const months = [
    "января",
    "февраля",
    "марта",
    "апреля",
    "мая",
    "июня",
    "июля",
    "августа",
    "сентября",
    "октября",
    "ноября",
    "декабря",
  ];
  const d = new Date(dateStr);
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function ExternalLinkCard({ link }: { link: ExternalReviewLink }) {
  const icons: Record<string, string> = {
    twogis: "🗺️",
    google: "🔍",
    instagram: "📸",
    website: "🌐",
  };
  const labels: Record<string, string> = {
    twogis: "2ГИС",
    google: "Google",
    instagram: "Instagram",
    website: "Сайт",
  };

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-[var(--safety-orange)] hover:shadow-sm transition-all group"
    >
      <span className="text-2xl">{icons[link.source]}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-[var(--charcoal)]">{labels[link.source]}</span>
          {link.averageRating > 0 && (
            <span className="text-xs font-bold text-[var(--safety-orange)]">{link.averageRating}</span>
          )}
        </div>
        {link.totalReviews > 0 && (
          <span className="text-xs text-[var(--slate-blue)]">{link.totalReviews} отзывов</span>
        )}
      </div>
      <svg
        className="w-4 h-4 text-gray-400 group-hover:text-[var(--safety-orange)] transition-colors flex-shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
        />
      </svg>
    </a>
  );
}

interface ReviewSectionProps {
  reviews: Review[];
  externalLinks: ExternalReviewLink[];
  companyName: string;
  rating?: number;
  reviewCount?: number;
}

export default function ReviewSection({
  reviews,
  externalLinks,
  companyName,
  rating,
  reviewCount,
}: ReviewSectionProps) {
  const [showAll, setShowAll] = useState(false);
  const displayReviews = showAll ? reviews : reviews.slice(0, 3);

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : rating?.toFixed(1) || "—";

  const positive = reviews.filter((r) => r.rating >= 4).length;
  const negative = reviews.filter((r) => r.rating <= 2).length;
  const neutral = reviews.length - positive - negative;

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-100">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="font-heading text-2xl font-semibold text-[var(--charcoal)] mb-1">Отзывы</h2>
          <p className="text-sm text-[var(--slate-blue)]">
            {reviews.length > 0
              ? `${reviews.length} отзывов на сайте`
              : reviewCount
                ? `${reviewCount} отзывов на внешних площадках`
                : "Отзывов пока нет"}
          </p>
        </div>
        {(rating || reviews.length > 0) && (
          <div className="text-right">
            <div className="text-3xl font-heading font-bold text-[var(--safety-orange)]">{avgRating}</div>
            <StarRating rating={Math.round(Number(avgRating))} />
          </div>
        )}
      </div>

      {reviews.length > 0 && (
        <div className="flex gap-4 mb-6 p-3 bg-[var(--soft-white)] rounded-lg flex-wrap">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
            <span className="text-xs text-[var(--slate-blue)]">Положительные: {positive}</span>
          </div>
          {neutral > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
              <span className="text-xs text-[var(--slate-blue)]">Нейтральные: {neutral}</span>
            </div>
          )}
          {negative > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span className="text-xs text-[var(--slate-blue)]">Отрицательные: {negative}</span>
            </div>
          )}
        </div>
      )}

      {externalLinks.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-[var(--charcoal)] mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-[var(--safety-orange)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
            Читать отзывы на площадках
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {externalLinks.map((link) => (
              <ExternalLinkCard key={`${link.companyId}-${link.source}`} link={link} />
            ))}
          </div>
        </div>
      )}

      {displayReviews.length > 0 && (
        <div className="space-y-4">
          {displayReviews.map((review, i) => (
            <div key={i} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[var(--warm-beige)] flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-[var(--slate-blue)]">
                      {review.author.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[var(--charcoal)]">{review.author}</span>
                      {review.verified && (
                        <svg className="w-3.5 h-3.5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                    <span className="text-xs text-[var(--slate-blue)]">{formatDate(review.date)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StarRating rating={review.rating} />
                  <SourceBadge source={review.source} />
                </div>
              </div>
              <p className="text-sm text-[var(--slate-blue)] leading-relaxed ml-11">{review.text}</p>
              {review.helpful !== undefined && review.helpful > 0 && (
                <div className="ml-11 mt-2 text-xs text-[var(--slate-blue)]">Полезно: {review.helpful}</div>
              )}
              {review.officialReply && (
                <div className="ml-11 mt-3 p-3 bg-[var(--safety-orange)]/5 rounded-lg border-l-2 border-[var(--safety-orange)]">
                  <div className="flex items-center gap-1 mb-1">
                    <span className="text-xs font-semibold text-[var(--safety-orange)]">Ответ {companyName}</span>
                  </div>
                  <p className="text-xs text-[var(--slate-blue)]">{review.officialReply}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {reviews.length > 3 && !showAll && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="mt-4 w-full py-2.5 text-sm font-medium text-[var(--safety-orange)] border border-[var(--safety-orange)]/30 rounded-lg hover:bg-[var(--safety-orange)]/5 transition-colors"
        >
          Показать все {reviews.length} отзывов
        </button>
      )}

      {reviews.length === 0 && externalLinks.length === 0 && (
        <p className="text-sm text-[var(--slate-blue)] italic">
          Отзывы для {companyName} пока не собраны. Оставьте отзыв на 2ГИС после сотрудничества.
        </p>
      )}
    </div>
  );
}
