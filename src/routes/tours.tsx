import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Clock, MapPin, Star, Users } from "lucide-react";
import { CardGridSkeleton, EmptyState, ErrorState } from "@/components/common/states";
import { tourCategoryIcon } from "@/components/tour/TourCategoryBadge";
import { refDataQuery, toursListQuery } from "@/lib/data";
import { formatPrice } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/tours")({
  head: () => ({
    meta: [
      { title: "Tours and experiences in Armenia — StayLand" },
      {
        name: "description",
        content: "Day trips, hikes, wine routes and cultural experiences hosted by local Armenian guides.",
      },
      { property: "og:title", content: "Tours and experiences in Armenia" },
      { property: "og:description", content: "Book Armenian tours led by local guides." },
    ],
  }),
  component: ToursPage,
});

function ToursPage() {
  const { t, lang, localized } = useI18n();
  const { data: tours, isPending, error, refetch } = useQuery(toursListQuery());
  const { data: ref } = useQuery(refDataQuery());
  const [category, setCategory] = useState<string | null>(null);

  const categories = useMemo(() => {
    const used = new Set((tours ?? []).map((x) => x.category));
    return (ref?.categories ?? []).filter((c) => used.has(c.code));
  }, [ref, tours]);

  const filtered = useMemo(() => {
    const all = tours ?? [];
    if (!category) return all;
    return all.filter((x) => x.category === category);
  }, [tours, category]);

  const featured = filtered[0];
  const rest = filtered.slice(1);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/70">
        <div className="absolute inset-0">
          <img src="/images/demo/tour-hike.jpg" alt="" className="size-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-foreground/70 via-foreground/45 to-background" />
        </div>
        <div className="container-page relative z-10 py-16 text-center md:py-24">
          <p className="eyebrow text-background/85">{t("nav.tours")}</p>
          <h1 className="mx-auto mt-4 max-w-3xl font-display text-4xl text-background drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)] md:text-5xl">
            {t("tours.heroTitle")}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-background/90 drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)]">
            {t("tours.heroSubtitle")}
          </p>
        </div>
      </section>

      <div className="container-page py-10">
        {/* Category filters */}
        <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 pb-2">
          <button
            type="button"
            onClick={() => setCategory(null)}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              !category ? "border-brand bg-brand text-brand-foreground" : "border-border bg-card hover:border-brand"
            }`}
          >
            {t("common.all")}
          </button>
          {categories.map((c) => {
            const Icon = tourCategoryIcon(c.icon);
            return (
              <button
                key={c.code}
                type="button"
                onClick={() => setCategory(c.code)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                  category === c.code
                    ? "border-brand bg-brand text-brand-foreground"
                    : "border-border bg-card hover:border-brand"
                }`}
              >
                <Icon className="size-3.5" />
                {localized(c, "name")}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="mt-8">
          {isPending ? (
            <CardGridSkeleton count={6} />
          ) : error ? (
            <ErrorState message={(error as Error).message} onRetry={() => void refetch()} />
          ) : filtered.length === 0 ? (
            <EmptyState title={t("empty.noResults")} />
          ) : (
            <>
              {/* Featured tour */}
              {featured ? (
                <Link
                  to="/tour/$slug"
                  params={{ slug: featured.slug }}
                  className="group relative mb-8 block overflow-hidden rounded-3xl border border-border bg-card shadow-card transition-shadow hover:shadow-lift"
                >
                  <div className="grid md:grid-cols-2">
                    <div className="relative aspect-4/3 overflow-hidden bg-surface md:aspect-auto">
                      {featured.main_image_url ? (
                        <img
                          src={featured.main_image_url}
                          alt={featured.name}
                          className="size-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                        />
                      ) : null}
                      <span className="absolute left-4 top-4 rounded-full bg-brand px-3 py-1 text-xs font-semibold text-brand-foreground">
                        ★ {t("tours.featured")}
                      </span>
                    </div>
                    <div className="flex flex-col justify-center p-6 md:p-8">
                      {(() => {
                        const cat = ref?.categories.find((c) => c.code === featured.category);
                        const Icon = tourCategoryIcon(cat?.icon);
                        return (
                          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Icon className="size-3.5" /> {cat ? localized(cat, "name") : featured.category}
                          </p>
                        );
                      })()}
                      <h2 className="mt-2 font-display text-2xl font-semibold leading-snug md:text-3xl">
                        {featured.name}
                      </h2>
                      <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{featured.description}</p>
                      <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="size-3.5" /> {featured.city_code}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="size-3.5" /> {featured.duration_hours} {t("tours.hours")}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="size-3.5" /> {featured.max_participants}
                        </span>
                        {featured.review_count > 0 ? (
                          <span className="flex items-center gap-1">
                            <Star className="size-3.5 fill-gold text-gold" /> {Number(featured.rating).toFixed(1)} (
                            {featured.review_count})
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-5 flex items-end justify-between">
                         <p className="text-sm">
                           {t("common.from") ? <span className="text-xs text-muted-foreground">{t("common.from")} </span> : null}
                           <span className="font-display text-2xl font-semibold text-brand">
                             {formatPrice(Number(featured.price), featured.currency ?? "AMD", lang)}
                           </span>
                           {t("common.fromAfter") ? (
                             <span className="text-xs text-muted-foreground">{t("common.fromAfter")}</span>
                           ) : null}
                           <span className="text-xs text-muted-foreground"> / {t("common.person")}</span>
                         </p>
                        <span className="rounded-full border border-border px-4 py-2 text-sm font-semibold transition-colors group-hover:border-brand group-hover:text-brand">
                          {t("tours.viewDetails")}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ) : null}

              {/* Grid */}
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((tour) => {
                  const cat = ref?.categories.find((c) => c.code === tour.category);
                  const Icon = tourCategoryIcon(cat?.icon);
                  return (
                    <Link
                      key={tour.id}
                      to="/tour/$slug"
                      params={{ slug: tour.slug }}
                      className="group overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
                    >
                      <div className="relative aspect-4/3 overflow-hidden bg-surface">
                        {tour.main_image_url ? (
                          <img
                            src={tour.main_image_url}
                            alt={tour.name}
                            loading="lazy"
                            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : null}
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-foreground/50 to-transparent" />
                        <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-card/90 px-2.5 py-1 text-xs font-medium backdrop-blur">
                          <Icon className="size-3" /> {cat ? localized(cat, "name") : tour.category}
                        </span>
                        {tour.review_count > 0 ? (
                          <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-card/90 px-2.5 py-1 text-xs font-semibold backdrop-blur">
                            <Star className="size-3 fill-gold text-gold" /> {Number(tour.rating).toFixed(1)}
                          </span>
                        ) : null}
                      </div>
                      <div className="space-y-2 p-4">
                        <p className="font-display text-base font-semibold leading-snug">{tour.name}</p>
                        <p className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="size-3" /> {tour.city_code}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="size-3" /> {tour.duration_hours} {t("tours.hours")}
                          </span>
                        </p>
                         <p className="pt-1 text-sm">
                           {t("common.from") ? <span className="text-xs text-muted-foreground">{t("common.from")} </span> : null}
                           <span className="font-display text-lg font-semibold">
                             {formatPrice(Number(tour.price), tour.currency ?? "AMD", lang)}
                           </span>
                           {t("common.fromAfter") ? (
                             <span className="text-xs text-muted-foreground">{t("common.fromAfter")}</span>
                           ) : null}
                           <span className="text-xs text-muted-foreground"> / {t("common.person")}</span>
                         </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
