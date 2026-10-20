import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Check, Moon } from "lucide-react";
import heroImg from "@/assets/packages-hero.jpg";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState } from "@/components/common/states";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { TreePine } from "lucide-react";
import { PACKAGE_ICONS, packageNights, packagesQuery, type PackageRow } from "@/lib/packages";

export const Route = createFileRoute("/packages")({
  head: () => ({
    meta: [
      { title: "Ամանորյա փաթեթներ — StayLand Հայաստան" },
      { name: "description", content: "Ամանորյա և տոնական փաթեթներ Հայաստանի լավագույն հյուրատներում՝ ամսաթվերով, գներով և ներառված ծառայություններով։" },
      { property: "og:title", content: "Ամանորյա փաթեթներ — StayLand" },
      { property: "og:description", content: "Տոնական հանգիստ հյուրատներում՝ պատրաստի փաթեթներով։" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PackagesPage,
});

const MONTHS: Record<string, string[]> = {
  hy: ["հունվ", "փետր", "մարտ", "ապր", "մայ", "հուն", "հուլ", "օգոս", "սեպտ", "հոկտ", "նոյ", "դեկ"],
  ru: ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"],
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
};

function shortDate(iso: string, lang: string) {
  const [, m, d] = iso.split("-").map(Number);
  return `${d} ${(MONTHS[lang] ?? MONTHS["en"] ?? [])[(m ?? 1) - 1] ?? ""}`;
}

function PackagesPage() {
  const { t } = useI18n();
  const q = useQuery(packagesQuery());

  return (
    <div>
      <section className="relative overflow-hidden">
        <img src={heroImg} alt="" width={1600} height={704} fetchPriority="high" decoding="async" className="h-64 w-full object-cover sm:h-80" />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/30 to-transparent" />
        <div className="container-page absolute inset-x-0 bottom-0 pb-6 sm:pb-10">
          <p className="text-sm font-medium uppercase tracking-wider text-background/80">{t("packages.eyebrow")}</p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-background sm:text-5xl">{t("packages.title")}</h1>
          <p className="mt-2 max-w-xl text-sm text-background/90 sm:text-base">{t("packages.sub")}</p>
        </div>
      </section>

      <div className="container-page py-8 sm:py-12">
        {q.isPending ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-96 rounded-2xl" />)}
          </div>
        ) : q.isError ? (
          <ErrorState message={t("error.friendly")} onRetry={() => q.refetch()} />
        ) : q.data.length === 0 ? (
          <EmptyState title={t("packages.empty")} />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {q.data.map((p) => <PackageCard key={p.id} p={p} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function PackageCard({ p }: { p: PackageRow }) {
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
            <CalendarDays className="size-3.5" /> {shortDate(p.check_in, lang)} – {shortDate(p.check_out, lang)}
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
          {p.property ? (
            <Button asChild className="w-full">
              <Link to="/property/$slug" params={{ slug: p.property.slug }} search={{ checkIn: p.check_in, checkOut: p.check_out }}>
                {t("book.openModal")}
              </Link>
            </Button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
