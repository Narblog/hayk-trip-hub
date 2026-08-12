import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CardGridSkeleton, EmptyState } from "@/components/common/states";
import { PropertyCard, type PropertyCardData } from "@/components/property/PropertyCard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { favoritesQuery } from "@/lib/data";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/favorites")({
  head: () => ({
    meta: [
      { title: "Saved stays — Hyur Armenia" },
      { name: "description", content: "Your saved Armenian hotels, guesthouses, cabins and villas in one place." },
      { property: "og:title", content: "Saved stays — Hyur" },
      { property: "og:description", content: "Your shortlist of Armenian stays." },
    ],
  }),
  component: FavoritesPage,
});

function FavoritesPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { data, isPending } = useQuery(favoritesQuery(user?.id ?? null));

  if (!user)
    return (
      <div className="container-page py-16">
        <EmptyState title={t("fav.title")} description={t("fav.empty")}>
          <Button asChild>
            <Link to="/auth">{t("nav.login")}</Link>
          </Button>
        </EmptyState>
      </div>
    );

  const items = (data ?? [])
    .map((r) => (r as unknown as { properties: PropertyCardData | null }).properties)
    .filter(Boolean) as PropertyCardData[];

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
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((p) => (
              <PropertyCard key={p.id} p={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
