import { Link } from "@tanstack/react-router";
import { CalendarDays, Check, MapPin, Moon, TreePine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { PACKAGE_ICONS, packageNights, type PackageRow } from "@/lib/packages";
import { shortPackageDate } from "@/components/package/PackageCard";

export function PackageFeatureCard({ p, flip = false }: { p: PackageRow; flip?: boolean }) {
  const { t, lang } = useI18n();
  const Icon = PACKAGE_ICONS[p.icon] ?? TreePine;
  const photos = Array.from(new Set([p.image_url, ...p.image_urls].filter((u): u is string => !!u)));
  const cover = photos[0] ?? p.property?.main_image_url ?? null;
  const extra = photos.slice(1, 4);
  const nights = packageNights(p);

  return (
    <article className="grid min-w-0 overflow-hidden rounded-2xl border border-border bg-card shadow-card lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      <div className={`min-w-0 p-4 sm:p-5 ${flip ? "lg:order-2" : ""}`}>
        <div className="relative overflow-hidden rounded-xl bg-muted">
          {cover ? (
            <img
              src={cover}
              alt={p.title}
              loading="lazy"
              decoding="async"
              className="aspect-[16/10] h-full w-full object-cover"
            />
          ) : (
            <div className="grid aspect-[16/10] w-full place-items-center text-muted-foreground">
              <Icon className="size-10" />
            </div>
          )}
          <span className="absolute left-3 top-3 grid size-11 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg">
            <Icon className="size-5" />
          </span>
        </div>
        {extra.length ? (
          <div className="mt-3 grid grid-cols-3 gap-2">
            {extra.map((url) => (
              <img
                key={url}
                src={url}
                alt={p.title}
                loading="lazy"
                decoding="async"
                className="aspect-[4/3] w-full rounded-lg object-cover"
              />
            ))}
          </div>
        ) : null}
      </div>

      <div className={`flex min-w-0 flex-col p-5 sm:p-7 ${flip ? "lg:order-1" : ""}`}>
        <h2 className="break-words font-display text-2xl font-semibold sm:text-3xl">{p.title}</h2>
        {p.property ? (
          <Link
            to="/property/$slug"
            params={{ slug: p.property.slug }}
            className="mt-1.5 inline-flex w-fit items-center gap-1.5 break-words text-sm text-muted-foreground hover:text-brand hover:underline"
          >
            <MapPin className="size-4 shrink-0" />
            <span className="min-w-0 break-words">{p.property.name}</span>
          </Link>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5">
            <CalendarDays className="size-4" /> {shortPackageDate(p.check_in, lang)} – {shortPackageDate(p.check_out, lang)}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5">
            <Moon className="size-4" /> {nights} {t("packages.nights")}
          </span>
        </div>

        {p.description ? <p className="mt-4 break-words text-base leading-relaxed text-muted-foreground">{p.description}</p> : null}

        {p.includes.length ? (
          <div className="mt-5">
            <p className="font-display text-base font-semibold">{t("packages.includesTitle")}</p>
            <ul className="mt-2 grid gap-x-5 gap-y-2 text-sm sm:grid-cols-2">
              {p.includes.map((x, i) => (
                <li key={i} className="flex min-w-0 items-start gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span className="min-w-0 break-words">{x}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-6">
          <div className="min-w-0">
            <p className="break-words font-display text-2xl font-semibold">{formatPrice(Number(p.price), p.currency, lang)}</p>
            {nights > 0 ? (
              <p className="text-xs text-muted-foreground">
                {formatPrice(Math.round(Number(p.price) / nights), p.currency, lang)} / {t("packages.nights")}
              </p>
            ) : null}
          </div>
          <Button asChild size="lg" className="shrink-0">
            <Link to="/package/$id" params={{ id: p.id }}>
              {t("packages.book")}
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
