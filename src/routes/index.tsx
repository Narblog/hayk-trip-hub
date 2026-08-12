import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CardGridSkeleton } from "@/components/common/states";
import { PropertyCard, type PropertyCardData } from "@/components/property/PropertyCard";
import { SearchBar } from "@/components/search/SearchBar";
import { homeQuery } from "@/lib/data";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Hyur — Stays, tours and experiences in Armenia" },
      { name: "description", content: "Find Armenian hotels, guesthouses, mountain cabins, villas and apartments, plus tours led by local guides." },
      { property: "og:title", content: "Hyur — Stays and tours in Armenia" },
      { property: "og:description", content: "Armenian hospitality, listed by the people who host it." },
    ],
  }),
  component: Home,
});

function Row({ title, items }: { title: string; items: PropertyCardData[] }) {
  const { t } = useI18n();
  if (!items.length) return null;
  return (
    <section className="mt-14">
      <div className="flex items-end justify-between gap-4">
        <h2 className="font-display text-2xl font-semibold">{title}</h2>
        <Link to="/search" className="text-sm font-semibold text-brand hover:underline">
          {t("home.seeAll")}
        </Link>
      </div>
      <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.slice(0, 4).map((p) => (
          <PropertyCard key={p.id} p={p} />
        ))}
      </div>
    </section>
  );
}

function Home() {
  const { t, localized } = useI18n();
  const { data, isPending } = useQuery(homeQuery());

  return (
    <div>
      <section className="relative overflow-hidden border-b border-border bg-surface">
        <div className="container-page relative py-20 md:py-28">
          <h1 className="max-w-3xl font-display text-4xl font-semibold leading-tight md:text-6xl">
            {t("hero.title")}
          </h1>
          <p className="mt-4 max-w-xl text-lg text-muted-foreground">{t("hero.subtitle")}</p>
          <div className="mt-9 max-w-4xl">
            <SearchBar />
          </div>
        </div>
      </section>

      <div className="container-page pb-8">
        {data?.cities?.length ? (
          <section className="mt-14">
            <h2 className="font-display text-2xl font-semibold">{t("home.popularDestinations")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("home.popularDestinationsSub")}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {data.cities.map((c) => (
                <Link
                  key={c.code}
                  to="/search"
                  search={{ destination: localized(c, "name"), guests: 2, page: 1 }}
                  className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium transition-colors hover:border-brand hover:text-brand"
                >
                  {localized(c, "name")}
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {isPending ? (
          <div className="mt-14">
            <CardGridSkeleton count={4} />
          </div>
        ) : (
          <>
            <Row title={t("home.recommended")} items={(data?.recommended ?? []) as PropertyCardData[]} />
            <Row title={t("home.guesthouses")} items={(data?.guesthouses ?? []) as PropertyCardData[]} />
            <Row title={t("home.cabins")} items={(data?.cabins ?? []) as PropertyCardData[]} />
            <Row title={t("home.hotels")} items={(data?.hotels ?? []) as PropertyCardData[]} />
          </>
        )}
      </div>
    </div>
  );
}
