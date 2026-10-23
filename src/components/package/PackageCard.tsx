import { Link } from "@tanstack/react-router";
import { CalendarDays, Check, Moon, TreePine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { PACKAGE_ICONS, packageNights, type PackageRow } from "@/lib/packages";

const MONTHS: Record<string, string[]> = {
  hy: ["հունվ", "փետր", "մարտ", "ապր", "մայ", "հուն", "հուլ", "օգոս", "սեպտ", "հոկտ", "նոյ", "դեկ"],
  ru: ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"],
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
};

export function shortPackageDate(iso: string, lang: string) {
  const [, m, d] = iso.split("-").map(Number);
  return `${d} ${(MONTHS[lang] ?? MONTHS["en"] ?? [])[(m ?? 1) - 1] ?? ""}`;
}

export function PackageCard({ p }: { p: PackageRow }) {
  const { t, lang } = useI18n();
  const Icon = PACKAGE_ICONS[p.icon] ?? TreePine;
  const img = p.image_url || p.property?.main_image_url;
  const nights = packageNights(p);

  return (
    <article className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card">
      <div className="relative aspect-[4/3] bg-muted">
        {img ? <img src={img} alt={p.title} loading="lazy" className="h-full w-full object-cover" /> : null}
        <span className="absolute left-3 top-3 grid size-11 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg">
          <Icon className="size-5" />
        </span>
        <span className="absolute bottom-3 right-3 rounded-full bg-background/95 px-3 py-1 text-sm font-semibold">
          {formatPrice(Number(p.price), p.currency, lang)}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <h2 className="break-words font-display text-xl font-semibold">{p.title}</h2>
        {p.property ? <p className="mt-0.5 text-sm text-muted-foreground">{p.property.name}</p> : null}
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1">
            <CalendarDays className="size-3.5" /> {shortPackageDate(p.check_in, lang)} – {shortPackageDate(p.check_out, lang)}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1">
            <Moon className="size-3.5" /> {nights} {t("packages.nights")}
          </span>
        </div>
        {p.description ? <p className="mt-3 break-words text-sm text-muted-foreground">{p.description}</p> : null}
        {p.includes.length ? (
          <ul className="mt-3 space-y-1.5 text-sm">
            {p.includes.map((x, i) => (
              <li key={i} className="flex items-start gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-primary" /> <span className="break-words">{x}</span>
              </li>
            ))}
          </ul>
        ) : null}
        <div className="mt-auto pt-5">
          <Button asChild className="w-full">
            <Link to="/package/$id" params={{ id: p.id }}>
              {t("packages.book")}
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
