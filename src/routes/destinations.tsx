import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MapPin } from "lucide-react";
import { CardGridSkeleton, EmptyState } from "@/components/common/states";
import { destinationsQuery } from "@/lib/data";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/destinations")({
  head: () => ({
    meta: [
      { title: "Destinations in Armenia — StayLand" },
      {
        name: "description",
        content:
          "Explore Armenia by destination — Dilijan, Tsaghkadzor, Sevan, Jermuk, Gyumri, Goris, Garni and Yerevan. See how many stays are available in each.",
      },
      { property: "og:title", content: "Explore Armenia — StayLand destinations" },
      { property: "og:description", content: "Browse Armenian towns and regions and find stays in each." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DestinationsPage,
});

function DestinationsPage() {
  const { t, localized } = useI18n();
  const { data, isPending } = useQuery(destinationsQuery());

  const items = (data ?? []).slice().sort((a, b) => {
    if (a.is_popular !== b.is_popular) return a.is_popular ? -1 : 1;
    return b.stays - a.stays;
  });

  return (
    <div className="container-page py-10">
      <p className="eyebrow text-brand">{t("dest.eyebrow")}</p>
      <h1 className="mt-2 font-display text-4xl md:text-5xl">{t("dest.title")}</h1>
      <p className="mt-3 max-w-xl text-muted-foreground">{t("dest.subtitle")}</p>

      <div className="mt-10">
        {isPending ? (
          <CardGridSkeleton count={8} />
        ) : items.length === 0 ? (
          <EmptyState title={t("empty.noResults")} description={t("empty.noResultsSub")} />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((c) => (
              <Link
                key={c.code}
                to="/search"
                search={{ destination: localized(c, "name"), guests: 2, page: 1 }}
                className="group relative block overflow-hidden rounded-3xl border border-border/70 bg-card shadow-card transition-shadow hover:shadow-lift"
              >
                <div className="relative aspect-[4/5] overflow-hidden bg-surface">
                  {c.image_url ? (
                    <img
                      src={c.image_url}
                      alt={localized(c, "name")}
                      loading="lazy"
                      className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center text-muted-foreground">
                      <MapPin className="size-8" />
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/85 via-foreground/20 to-transparent p-5">
                    <h2 className="font-display text-xl text-background">{localized(c, "name")}</h2>
                    <p className="text-xs text-background/80">
                      {c.stays} {c.stays === 1 ? t("dest.stayOne") : t("dest.stays")}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
