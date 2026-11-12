import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BedDouble, MapPin, Users } from "lucide-react";
import { FavoriteButton } from "./FavoriteButton";
import { refDataQuery } from "@/lib/data";
import { formatPrice } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

export type PropertyCardData = {
  id: string;
  name: string;
  name_hy?: string | null;
  name_ru?: string | null;
  name_en?: string | null;
  slug: string;
  property_type: string;
  city_code: string | null;
  price_per_night: number;
  currency?: string;
  max_guests: number;
  bedrooms: number;
  rating: number;
  review_count: number;
  main_image_url: string | null;
  amenity_codes?: string[];
  is_featured?: boolean;
};

export function PropertyCard({
  p,
  showAvailable = false,
  compact = false,
}: {
  p: PropertyCardData;
  showAvailable?: boolean;
  compact?: boolean;
}) {
  const { t, lang, localized } = useI18n();
  const { data: ref } = useQuery(refDataQuery());
  const city = ref?.cities.find((c) => c.code === p.city_code);
  const title = localized(p, "name") || p.name;
  const type = ref?.types.find((x) => x.code === p.property_type);

  return (
    <article className="group relative flex flex-col rounded-3xl border border-border/60 bg-card p-2 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lift sm:p-2.5">
      <Link
        to="/property/$slug"
        params={{ slug: p.slug }}
        className="relative block aspect-4/3 overflow-hidden rounded-2xl bg-surface"
      >
        {p.main_image_url ? (
          <img
            src={p.main_image_url}
            alt={title}
            loading="lazy"
            width={1000}
            height={750}
            className="size-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
          />
        ) : null}

        {/* featured / available tags */}
        {p.is_featured || showAvailable ? (
          <div className="absolute left-2.5 top-2.5 flex flex-col items-start gap-1.5">
            {p.is_featured ? (
              <span className="rounded-full bg-brand px-2.5 py-1 text-[11px] font-semibold text-brand-foreground shadow-card">
                {t("card.featured")}
              </span>
            ) : null}
            {showAvailable ? (
              <span className="rounded-full bg-success px-2.5 py-1 text-[11px] font-semibold text-success-foreground">
                {t("card.available")}
              </span>
            ) : null}
          </div>
        ) : null}
      </Link>

      <FavoriteButton propertyId={p.id} className="absolute right-4 top-4 z-20 sm:right-5 sm:top-5" />

      <div className="flex flex-1 flex-col px-1.5 pb-1.5 pt-2.5 sm:px-2 sm:pt-3">
        <Link to="/property/$slug" params={{ slug: p.slug }}>
          <h3 className="line-clamp-1 font-display text-base leading-snug sm:text-lg">{title}</h3>
        </Link>

        <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] text-muted-foreground sm:text-xs">
          <span className="flex min-w-0 items-center gap-1">
            <MapPin className="size-3.5 shrink-0" />
            <span className="truncate">{localized(city, "name") || p.city_code}</span>
          </span>
          <span className="flex items-center gap-1">
            <Users className="size-3.5" /> {p.max_guests} {t("card.guests")}
          </span>
          {compact ? null : (
            <span className="flex items-center gap-1">
              <BedDouble className="size-3.5" /> {p.bedrooms} {t("card.bedrooms")}
            </span>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 pt-2.5 sm:pt-3">
          <p className="min-w-0 leading-tight">
            <span className="font-display text-sm text-foreground sm:text-lg">
              {formatPrice(Number(p.price_per_night), p.currency ?? "AMD", lang)}
            </span>
            <span className="ml-1 text-[10px] text-muted-foreground sm:text-xs">/ {t("card.perNight")}</span>
          </p>
          <span className="shrink-0 rounded-full bg-brand-soft px-2.5 py-1 text-[10px] font-medium text-brand sm:text-[11px]">
            {localized(type, "name") || p.property_type}
          </span>
        </div>
      </div>

      {compact ? (
        <Link
          to="/property/$slug"
          params={{ slug: p.slug }}
          aria-label={title}
          className="absolute inset-0 z-10"
        />
      ) : null}
    </article>
  );
}
