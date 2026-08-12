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
};

export function PropertyCard({ p, showAvailable = false }: { p: PropertyCardData; showAvailable?: boolean }) {
  const { t, lang, localized } = useI18n();
  const { data: ref } = useQuery(refDataQuery());
  const city = ref?.cities.find((c) => c.code === p.city_code);
  const type = ref?.types.find((x) => x.code === p.property_type);

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-shadow hover:shadow-lift">
      <Link to="/property/$slug" params={{ slug: p.slug }} className="block">
        <div className="relative aspect-4/3 overflow-hidden bg-surface">
          {p.main_image_url ? (
            <img
              src={p.main_image_url}
              alt={p.name}
              loading="lazy"
              width={1200}
              height={900}
              className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            />
          ) : null}
          {showAvailable ? (
            <span className="absolute bottom-3 left-3 rounded-full bg-success px-2.5 py-1 text-[11px] font-semibold text-success-foreground">
              {t("card.available")}
            </span>
          ) : null}
        </div>
      </Link>
      <FavoriteButton propertyId={p.id} className="absolute right-3 top-3" />

      <div className="space-y-2.5 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              to="/property/$slug"
              params={{ slug: p.slug }}
              className="line-clamp-1 font-display text-base font-semibold hover:text-brand"
            >
              {p.name}
            </Link>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="size-3" />
              <span className="truncate">
                {localized(city, "name") || p.city_code} · {localized(type, "name") || p.property_type}
              </span>
            </p>
          </div>
          {p.review_count > 0 ? (
            <span className="flex shrink-0 items-center gap-1 rounded-lg bg-surface px-2 py-1 text-xs font-semibold">
              <Star className="size-3 fill-gold text-gold" />
              {Number(p.rating).toFixed(1)}
              <span className="font-normal text-muted-foreground">({p.review_count})</span>
            </span>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="size-3.5" /> {p.max_guests} {t("card.guests")}
          </span>
          <span className="flex items-center gap-1">
            <BedDouble className="size-3.5" /> {p.bedrooms} {t("card.bedrooms")}
          </span>
        </div>

        <div className="flex items-end justify-between pt-1">
          <p className="text-sm">
            <span className="font-display text-lg font-semibold">
              {formatPrice(Number(p.price_per_night), p.currency ?? "AMD", lang)}
            </span>
            <span className="ml-1 text-xs text-muted-foreground">/ {t("card.perNight")}</span>
          </p>
          <Link
            to="/property/$slug"
            params={{ slug: p.slug }}
            className="text-xs font-semibold text-brand underline-offset-4 hover:underline"
          >
            {t("card.view")}
          </Link>
        </div>
      </div>
    </article>
  );
}