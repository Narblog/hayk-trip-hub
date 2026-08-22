import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Star, Users } from "lucide-react";
import { FavoriteButton } from "./FavoriteButton";
import type { PropertyCardData } from "./PropertyCard";
import { refDataQuery } from "@/lib/data";
import { formatPrice } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

export function PropertyCardCompact({ p }: { p: PropertyCardData }) {
  const { t, lang, localized } = useI18n();
  const { data: ref } = useQuery(refDataQuery());
  const city = ref?.cities.find((c) => c.code === p.city_code);
  const type = ref?.types.find((x) => x.code === p.property_type);

  return (
    <article className="group relative flex shrink-0 gap-3 overflow-hidden rounded-2xl border border-border/70 bg-card p-2.5 shadow-card transition-colors hover:border-brand/50">
      <Link
        to="/property/$slug"
        params={{ slug: p.slug }}
        className="relative size-28 shrink-0 overflow-hidden rounded-xl bg-surface"
      >
        {p.main_image_url ? (
          <img
            src={p.main_image_url}
            alt={p.name}
            loading="lazy"
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : null}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5 pr-8">
        <div className="min-w-0">
          <p className="truncate text-[11px] uppercase tracking-wide text-muted-foreground">
            {localized(city, "name") || p.city_code} · {localized(type, "name") || p.property_type}
          </p>
          <Link to="/property/$slug" params={{ slug: p.slug }}>
            <h3 className="mt-0.5 line-clamp-2 font-display text-base leading-snug">{p.name}</h3>
          </Link>
        </div>
        <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
          {p.review_count > 0 ? (
            <span className="flex items-center gap-1 font-semibold text-foreground">
              <Star className="size-3 fill-gold text-gold" />
              {Number(p.rating).toFixed(1)}
            </span>
          ) : null}
          <span className="flex items-center gap-1">
            <Users className="size-3.5" /> {p.max_guests}
          </span>
        </div>
        <p className="mt-1.5 font-display text-base text-brand">
          {formatPrice(Number(p.price_per_night), p.currency ?? "AMD", lang)}
          <span className="ml-1 text-[11px] font-normal text-muted-foreground">/ {t("card.perNight")}</span>
        </p>
      </div>

      <FavoriteButton propertyId={p.id} className="absolute right-2 top-2" />
    </article>
  );
}
