import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BedDouble, MapPin, Star, Users } from "lucide-react";
import { FavoriteButton } from "./FavoriteButton";
import { refDataQuery } from "@/lib/data";
import { formatPrice } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

export type PropertyCardData = {
  id: string;
  name: string;
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
  const type = ref?.types.find((x) => x.code === p.property_type);

  return (
    <article className="group relative overflow-hidden rounded-3xl border border-border/70 bg-card shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
      <Link to="/property/$slug" params={{ slug: p.slug }} className="block">
        <div className={`relative overflow-hidden bg-surface ${compact ? "aspect-4/3" : "aspect-4/5"}`}>
          {p.main_image_url ? (
            <img
              src={p.main_image_url}
              alt={p.name}
              loading="lazy"
              width={1000}
              height={1250}
              className="size-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
            />
          ) : null}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-foreground/55 to-transparent" />
          <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-card/90 px-2.5 py-1 text-xs font-semibold backdrop-blur">
            {p.review_count > 0 ? (
              <>
                <Star className="size-3 fill-gold text-gold" />
                {Number(p.rating).toFixed(1)}
                <span className="font-normal text-muted-foreground">({p.review_count})</span>
              </>
            ) : (
              <span className="font-normal text-muted-foreground">{t("reviews.new")}</span>
            )}
          </span>
          <div className="absolute inset-x-0 bottom-0 p-4">
            <p className="eyebrow text-background/85">
              {localized(city, "name") || p.city_code} · {localized(type, "name") || p.property_type}
            </p>
            <h3 className="mt-1 line-clamp-2 font-display text-xl leading-snug text-background">{p.name}</h3>
          </div>
          <div className="absolute left-3 top-12 flex flex-col items-start gap-1.5">
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
        </div>
      </Link>
      <FavoriteButton propertyId={p.id} className="absolute right-3 top-3 z-20" />

      <div className={compact ? "space-y-2 p-4" : "space-y-3 p-5"}>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="size-3.5" /> {localized(city, "name") || p.city_code}
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

        <div className="flex items-end justify-between border-t border-border/70 pt-3">
          <p className="text-sm">
            <span className="mr-1 text-xs text-muted-foreground">{t("card.from")}</span>
            <span className="font-display text-xl text-brand">
              {formatPrice(Number(p.price_per_night), p.currency ?? "AMD", lang)}
            </span>
            <span className="ml-1 text-xs text-muted-foreground">/ {t("card.perNight")}</span>
          </p>
          {compact ? null : (
            <Link
              to="/property/$slug"
              params={{ slug: p.slug }}
              className="rounded-full border border-border px-3.5 py-1.5 text-xs font-semibold transition-colors hover:border-brand hover:text-brand"
            >
              {t("card.view")}
            </Link>
          )}
        </div>
      </div>

      {compact ? (
        <Link
          to="/property/$slug"
          params={{ slug: p.slug }}
          aria-label={p.name}
          className="absolute inset-0 z-10"
        />
      ) : null}
    </article>
  );
}