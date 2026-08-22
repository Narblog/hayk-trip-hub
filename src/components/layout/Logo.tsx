import { Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";

export function Logo({ inverted = false }: { inverted?: boolean }) {
  const { t } = useI18n();
  return (
    <Link to="/" className="flex items-center gap-2.5" aria-label="StayLand home">
      <span className="relative flex size-9 items-center justify-center rounded-xl bg-brand text-brand-foreground">
        <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true" fill="none">
          <path d="M3 19 9.5 7l3.2 6 2.1-3.4L21 19H3Z" fill="currentColor" opacity="0.95" />
          <circle cx="17.5" cy="6.5" r="2.2" fill="currentColor" opacity="0.7" />
        </svg>
      </span>
      <span className="leading-none">
        <span className={`block font-display text-lg font-semibold ${inverted ? "text-primary-foreground" : ""}`}>
          StayLand
        </span>
        <span className="block text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          {t("brand.tagline")}
        </span>
      </span>
    </Link>
  );
}