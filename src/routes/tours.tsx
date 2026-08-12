import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Clock, MapPin, Star } from "lucide-react";
import { CardGridSkeleton, EmptyState, ErrorState } from "@/components/common/states";
import { homeQuery } from "@/lib/data";
import { formatPrice } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/tours")({
  head: () => ({
    meta: [
      { title: "Tours and experiences in Armenia — Hyur" },
      { name: "description", content: "Day trips, hikes, wine routes and cultural experiences hosted by local Armenian guides." },
      { property: "og:title", content: "Tours and experiences in Armenia" },
      { property: "og:description", content: "Book Armenian tours led by local guides." },
    ],
  }),
  component: ToursPage,
});

function ToursPage() {
  const { t, lang } = useI18n();
  const { data, isPending, error, refetch } = useQuery(homeQuery());
  const tours = data?.tours ?? [];

  return (
    <div className="container-page py-10">
      <h1 className="font-display text-3xl font-semibold">{t("tours.title")}</h1>
      <p className="mt-2 text-muted-foreground">{t("tours.subtitle")}</p>
      <div className="mt-8">
        {isPending ? (
          <CardGridSkeleton count={6} />
        ) : error ? (
          <ErrorState message={(error as Error).message} onRetry={() => void refetch()} />
        ) : tours.length === 0 ? (
          <EmptyState title={t("empty.noResults")} />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {tours.map((tour) => (
              <Link
                key={tour.id}
                to="/tour/$slug"
                params={{ slug: tour.slug }}
                className="group overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-shadow hover:shadow-lift"
              >
                <div className="aspect-4/3 overflow-hidden bg-surface">
                  {tour.main_image_url ? (
                    <img
                      src={tour.main_image_url}
                      alt={tour.name}
                      loading="lazy"
                      className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : null}
                </div>
                <div className="space-y-2 p-4">
                  <p className="font-display text-base font-semibold">{tour.name}</p>
                  <p className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="size-3" /> {tour.city_code}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="size-3" /> {tour.duration_hours} {t("tours.hours")}
                    </span>
                    {tour.review_count > 0 ? (
                      <span className="flex items-center gap-1">
                        <Star className="size-3 fill-gold text-gold" /> {Number(tour.rating).toFixed(1)}
                      </span>
                    ) : null}
                  </p>
                  <p className="pt-1 text-sm">
                    <span className="text-xs text-muted-foreground">{t("common.from")} </span>
                    <span className="font-display text-lg font-semibold">
                      {formatPrice(Number(tour.price), tour.currency ?? "AMD", lang)}
                    </span>
                    <span className="text-xs text-muted-foreground"> / {t("common.person")}</span>
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}