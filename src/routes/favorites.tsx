import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CardGridSkeleton, EmptyState } from "@/components/common/states";
import { PropertyCard, type PropertyCardData } from "@/components/property/PropertyCard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { favoritesQuery, getGuestFavoriteIds, guestFavoritesQuery } from "@/lib/data";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/favorites")({
  head: () => ({
    meta: [
      { title: "Saved stays — StayLand Armenia" },
      { name: "description", content: "Your saved Armenian hotels, guesthouses, cabins and villas in one place." },
      { property: "og:title", content: "Saved stays — StayLand" },
      { property: "og:description", content: "Your shortlist of Armenian stays." },
    ],
  }),
  component: FavoritesPage,
});

function FavoritesPage() {
  const { t } = useI18n();
  const { user, loading } = useAuth();
  const guestIds = user ? [] : getGuestFavoriteIds();
  const fav = useQuery(favoritesQuery(user?.id ?? null));
  const guestFav = useQuery(guestFavoritesQuery(guestIds));

  const isPending =
    loading || (user ? fav.isPending : guestIds.length > 0 && guestFav.isPending);
  const items: PropertyCardData[] = user
    ? ((fav.data ?? [])
        .map((r) => (r as unknown as { properties: PropertyCardData | null }).properties)
        .filter(Boolean) as PropertyCardData[])
    : ((guestFav.data ?? []) as unknown as PropertyCardData[]);

  return (
    <div className="container-page py-10">
      <h1 className="font-display text-3xl font-semibold">{t("fav.title")}</h1>
      <div className="mt-8">
        {isPending ? (
          <CardGridSkeleton count={4} />
        ) : items.length === 0 ? (
          <EmptyState title={t("fav.empty")}>
            <Button asChild variant="outline">
              <Link to="/search">{t("fav.browse")}</Link>
            </Button>
          </EmptyState>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((p) => (
              <PropertyCard key={p.id} p={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
