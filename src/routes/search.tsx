import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { CardGridSkeleton, EmptyState, ErrorState } from "@/components/common/states";
import { PropertyCard } from "@/components/property/PropertyCard";
import { SearchBar } from "@/components/search/SearchBar";
import { searchQuery } from "@/lib/data";
import { useI18n } from "@/lib/i18n";

const schema = z.object({
  destination: fallback(z.string(), "").default(""),
  checkIn: fallback(z.string(), "").default(""),
  checkOut: fallback(z.string(), "").default(""),
  guests: fallback(z.number(), 2).default(2),
  sort: fallback(z.string(), "recommended").default("recommended"),
  page: fallback(z.number(), 1).default(1),
});

export const Route = createFileRoute("/search")({
  validateSearch: zodValidator(schema),
  head: () => ({
    meta: [
      { title: "Search stays in Armenia — Hyur" },
      { name: "description", content: "Search hotels, guesthouses, cabins, villas and apartments across Armenia by dates, guests and price." },
      { property: "og:title", content: "Search stays in Armenia — Hyur" },
      { property: "og:description", content: "Find available stays across Armenia." },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const s = Route.useSearch();
  const { t } = useI18n();
  const params = {
    destination: s.destination,
    checkIn: s.checkIn,
    checkOut: s.checkOut,
    guests: s.guests,
    sort: s.sort,
    page: Math.max(1, s.page),
    pageSize: 12,
  };
  const { data, isPending, error, refetch } = useQuery(searchQuery(params));
  const total = data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / 12));

  return (
    <div className="container-page py-8">
      <SearchBar variant="compact" initial={params} />

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold">
          {total} {total === 1 ? t("search.resultsOne") : t("search.results")}
        </h1>
        <div className="flex flex-wrap gap-1.5">
          {["recommended", "price_asc", "price_desc", "rating"].map((k) => (
            <Link
              key={k}
              from="/search"
              search={(prev) => ({ ...prev, sort: k, page: 1 })}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                s.sort === k ? "border-brand bg-brand-soft text-brand" : "border-border hover:bg-surface"
              }`}
            >
              {t(`sort.${k}`)}
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-6">
        {isPending ? (
          <CardGridSkeleton />
        ) : error ? (
          <ErrorState message={(error as Error).message} onRetry={() => void refetch()} />
        ) : (data?.items.length ?? 0) === 0 ? (
          <EmptyState title={t("empty.noResults")} description={t("empty.noResultsSub")} />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data!.items.map((p) => (
              <PropertyCard key={p.id} p={p} showAvailable={!!s.checkIn && !!s.checkOut} />
            ))}
          </div>
        )}
      </div>

      {pages > 1 ? (
        <div className="mt-10 flex items-center justify-center gap-2">
          <Button asChild variant="outline" size="sm" disabled={s.page <= 1}>
            <Link from="/search" search={(prev) => ({ ...prev, page: Math.max(1, prev.page - 1) })}>
              {t("common.back")}
            </Link>
          </Button>
          <span className="text-sm text-muted-foreground">
            {s.page} / {pages}
          </span>
          <Button asChild variant="outline" size="sm" disabled={s.page >= pages}>
            <Link from="/search" search={(prev) => ({ ...prev, page: Math.min(pages, prev.page + 1) })}>
              {t("wizard.next")}
            </Link>
          </Button>
        </div>
      ) : null}
    </div>
  );
}