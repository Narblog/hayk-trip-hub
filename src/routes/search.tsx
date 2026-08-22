import { createFileRoute, Link, useNavigate, ClientOnly } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { lazy, Suspense, useCallback, useMemo, useState } from "react";
import { List, MapIcon, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { CardGridSkeleton, EmptyState, ErrorState } from "@/components/common/states";
import { PropertyCard } from "@/components/property/PropertyCard";
import { PropertyCardCompact } from "@/components/property/PropertyCardCompact";
import { SearchBar } from "@/components/search/SearchBar";
import { FilterPanel, PRICE_MAX, PRICE_MIN, type FilterValues } from "@/components/search/FilterPanel";
import { searchQuery } from "@/lib/data";
import { useI18n } from "@/lib/i18n";

const SearchMap = lazy(() => import("@/components/search/SearchMap"));

const schema = z.object({
  destination: fallback(z.string(), "").default(""),
  checkIn: fallback(z.string(), "").default(""),
  checkOut: fallback(z.string(), "").default(""),
  guests: fallback(z.number(), 2).default(2),
  sort: fallback(z.string(), "recommended").default("recommended"),
  page: fallback(z.number(), 1).default(1),
  types: fallback(z.string().array(), []).default([]),
  amenities: fallback(z.string().array(), []).default([]),
  minPrice: fallback(z.number(), PRICE_MIN).default(PRICE_MIN),
  maxPrice: fallback(z.number(), PRICE_MAX).default(PRICE_MAX),
  bedrooms: fallback(z.number(), 0).default(0),
  minRating: fallback(z.number(), 0).default(0),
  view: fallback(z.string(), "list").default("list"),
});

export const Route = createFileRoute("/search")({
  validateSearch: zodValidator(schema),
  head: () => ({
    meta: [
      { title: "Search stays in Armenia — StayLand" },
      {
        name: "description",
        content:
          "Search guesthouses, cabins, cottages and apartments across Armenia by dates, guests, price, amenities and map location.",
      },
      { property: "og:title", content: "Search stays in Armenia — StayLand" },
      { property: "og:description", content: "Find available stays across Armenia and contact owners directly." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const s = Route.useSearch();
  const navigate = useNavigate({ from: "/search" });
  const { t, lang } = useI18n();
  const [sheetOpen, setSheetOpen] = useState(false);

  const filters: FilterValues = {
    types: s["types"],
    amenities: s["amenities"],
    minPrice: Math.max(PRICE_MIN, s["minPrice"]),
    maxPrice: Math.min(PRICE_MAX, s["maxPrice"]),
    bedrooms: Math.max(0, s["bedrooms"]),
    minRating: Math.max(0, s["minRating"]),
  };

  const activeCount =
    filters["types"].length +
    filters["amenities"].length +
    (filters["minPrice"] > PRICE_MIN || filters["maxPrice"] < PRICE_MAX ? 1 : 0) +
    (filters["bedrooms"] > 0 ? 1 : 0) +
    (filters["minRating"] > 0 ? 1 : 0);

  const setFilters = (patch: Partial<FilterValues>) =>
    void navigate({ search: (prev) => ({ ...prev, ...patch, page: 1 }) });

  const clearFilters = () =>
    void navigate({
      search: (prev) => ({
        ...prev,
        types: [],
        amenities: [],
        minPrice: PRICE_MIN,
        maxPrice: PRICE_MAX,
        bedrooms: 0,
        minRating: 0,
        page: 1,
      }),
    });

  const pageSize = 12;
  const params = {
    destination: s["destination"],
    checkIn: s["checkIn"],
    checkOut: s["checkOut"],
    guests: s["guests"],
    sort: s["sort"],
    page: Math.max(1, s["page"]),
    pageSize,
    types: filters["types"],
    amenities: filters["amenities"],
    ...(filters["minPrice"] > PRICE_MIN ? { minPrice: filters["minPrice"] } : {}),
    ...(filters["maxPrice"] < PRICE_MAX ? { maxPrice: filters["maxPrice"] } : {}),
    ...(filters["bedrooms"] > 0 ? { bedrooms: filters["bedrooms"] } : {}),
    ...(filters["minRating"] > 0 ? { minRating: filters["minRating"] } : {}),
  };

  const { data, isPending, error, refetch } = useQuery(searchQuery(params));
  const total = data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const isMap = s["view"] === "map";

  const points = useMemo(
    () =>
      (data?.items ?? []).map((p) => ({
        id: p.id,
        slug: p.slug,
        name: p.name,
        latitude: p.latitude,
        longitude: p.longitude,
        price_per_night: Number(p.price_per_night),
        currency: p.currency,
        main_image_url: p.main_image_url,
      })),
    [data],
  );

  const openProperty = useCallback(
    (slug: string) => void navigate({ to: "/property/$slug", params: { slug } }),
    [navigate],
  );

  const panel = (
    <FilterPanel values={filters} onChange={setFilters} onClear={clearFilters} />
  );

  return (
    <div className="container-page py-8">
      <SearchBar variant="compact" initial={params} />

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold">
          {total} {total === 1 ? t("search.resultsOne") : t("search.results")}
        </h1>
        <div className="flex flex-wrap items-center gap-1.5">
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="rounded-full lg:hidden">
                <SlidersHorizontal className="size-4" />
                {t("search.filters")}
                {activeCount ? (
                  <span className="ml-1 rounded-full bg-brand px-1.5 text-[10px] text-brand-foreground">
                    {activeCount}
                  </span>
                ) : null}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[88vw] max-w-sm overflow-y-auto">
              <SheetTitle className="sr-only">{t("search.filters")}</SheetTitle>
              <div className="p-6 pt-12">{panel}</div>
              <div className="sticky bottom-0 border-t border-border bg-background p-4">
                <Button className="w-full" onClick={() => setSheetOpen(false)}>
                  {t("search.apply")}
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          <div className="flex rounded-full border border-border p-0.5">
            {(["list", "map"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => void navigate({ search: (prev) => ({ ...prev, view: v }) })}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${
                  (s["view"] === "map") === (v === "map") ? "bg-brand text-brand-foreground" : "text-muted-foreground"
                }`}
              >
                {v === "list" ? <List className="size-3.5" /> : <MapIcon className="size-3.5" />}
                {t(v === "list" ? "search.viewList" : "search.viewMap")}
              </button>
            ))}
          </div>

          {["recommended", "price_asc", "price_desc", "rating"].map((k) => (
            <Link
              key={k}
              from="/search"
              search={(prev) => ({ ...prev, sort: k, page: 1 })}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                s["sort"] === k ? "border-brand bg-brand-soft text-brand" : "border-border hover:bg-surface"
              }`}
            >
              {t(`sort.${k}`)}
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-6 gap-8 lg:flex lg:items-start">
        <aside className="hidden w-72 shrink-0 rounded-3xl border border-border/70 bg-card p-5 shadow-card lg:sticky lg:top-24 lg:block">
          {panel}
        </aside>

        <div className="min-w-0 flex-1">
          {isPending ? (
            isMap ? (
              <Skeleton className="h-[70vh] w-full rounded-3xl" />
            ) : (
              <CardGridSkeleton />
            )
          ) : error ? (
            <ErrorState message={(error as Error).message} onRetry={() => void refetch()} />
          ) : (data?.items.length ?? 0) === 0 ? (
            <EmptyState title={t("empty.noResults")} description={t("empty.noResultsSub")} />
          ) : isMap ? (
            <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
              <div className="h-[70vh] overflow-hidden rounded-3xl border border-border/70 shadow-card">
                <ClientOnly fallback={<Skeleton className="size-full" />}>
                  <Suspense fallback={<Skeleton className="size-full" />}>
                    <SearchMap points={points} lang={lang} onSelect={openProperty} />
                  </Suspense>
                </ClientOnly>
              </div>
              <div className="flex max-h-[70vh] flex-col gap-3 overflow-y-auto pr-1">
                {data!.items.map((p) => (
                  <PropertyCardCompact key={p.id} p={p} />
                ))}
              </div>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {data!.items.map((p) => (
                <PropertyCard key={p.id} p={p} showAvailable={!!s["checkIn"] && !!s["checkOut"]} />
              ))}
            </div>
          )}

          {pages > 1 && !isMap ? (
            <div className="mt-10 flex items-center justify-center gap-2">
              <Button asChild variant="outline" size="sm" disabled={s["page"] <= 1}>
                <Link from="/search" search={(prev) => ({ ...prev, page: Math.max(1, prev["page"] - 1) })}>
                  {t("common.back")}
                </Link>
              </Button>
              <span className="text-sm text-muted-foreground">
                {s["page"]} / {pages}
              </span>
              <Button asChild variant="outline" size="sm" disabled={s["page"] >= pages}>
                <Link from="/search" search={(prev) => ({ ...prev, page: Math.min(pages, prev["page"] + 1) })}>
                  {t("wizard.next")}
                </Link>
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
