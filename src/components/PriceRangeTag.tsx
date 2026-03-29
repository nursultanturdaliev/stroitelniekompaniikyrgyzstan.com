const priceLabels: Record<string, { label: string; color: string }> = {
  budget: { label: "Бюджетный", color: "bg-green-100 text-green-700" },
  mid: { label: "Средний", color: "bg-blue-100 text-blue-700" },
  premium: { label: "Премиум", color: "bg-purple-100 text-purple-700" },
  luxury: { label: "Люкс", color: "bg-amber-100 text-amber-700" },
};

interface PriceRangeTagProps {
  priceRange: string;
  size?: "sm" | "md";
}

export default function PriceRangeTag({ priceRange, size = "sm" }: PriceRangeTagProps) {
  const info = priceLabels[priceRange] || priceLabels.mid;

  return (
    <span
      className={`inline-block rounded-full font-medium ${info.color} ${
        size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-3 py-1"
      }`}
    >
      {info.label}
    </span>
  );
}
