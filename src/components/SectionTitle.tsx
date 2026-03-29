interface SectionTitleProps {
  subtitle: string;
  title: string;
  description?: string;
}

export default function SectionTitle({ subtitle, title, description }: SectionTitleProps) {
  return (
    <div className="text-center mb-12">
      <span className="text-[var(--safety-orange)] text-sm font-semibold uppercase tracking-widest">{subtitle}</span>
      <h2 className="font-heading text-3xl md:text-4xl font-bold text-[var(--charcoal)] mt-2 mb-4">{title}</h2>
      {description && <p className="text-[var(--slate-blue)] max-w-2xl mx-auto">{description}</p>}
    </div>
  );
}
