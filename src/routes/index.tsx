import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck, PhoneCall, CalendarCheck, Clock, MapPin, Star, ArrowRight, Compass } from "lucide-react";
import { CardGridSkeleton } from "@/components/common/states";
import { PropertyCard, type PropertyCardData } from "@/components/property/PropertyCard";
import { SearchBar } from "@/components/search/SearchBar";
import { destinationsQuery, homeQuery, refDataQuery } from "@/lib/data";
import { formatPrice } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import heroImage from "@/assets/hero-armenia.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "StayLand — Find your perfect stay in Armenia" },
      {
        name: "description",
        content:
          "Discover guesthouses, cabins, cottages and unforgettable experiences across Armenia. Contact owners directly — no booking commission.",
      },
      { property: "og:title", content: "StayLand — Stays and experiences in Armenia" },
      { property: "og:description", content: "Guesthouses, cabins and tours across Armenia. Contact owners directly." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function SectionHead({
  eyebrow,
  title,
  sub,
  to,
  linkLabel,
}: {
  eyebrow?: string | undefined;
  title: string;
  sub?: string | undefined;
  to?: "/search" | "/tours" | "/destinations" | undefined;
  linkLabel?: string | undefined;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        {eyebrow ? <p className="eyebrow text-brand">{eyebrow}</p> : null}
        <h2 className="mt-2 font-display text-3xl md:text-4xl">{title}</h2>
        {sub ? <p className="mt-2 max-w-xl text-sm text-muted-foreground">{sub}</p> : null}
      </div>
      {to ? (
        <Link
          to={to}
          className="shrink-0 rounded-full border border-border px-4 py-2 text-sm font-semibold transition-colors hover:border-brand hover:text-brand"
        >
          {linkLabel}
        </Link>
      ) : null}
    </div>
  );
}

function Row({
  title,
  eyebrow,
  sub,
  items,
}: {
  title: string;
  eyebrow?: string | undefined;
  sub?: string | undefined;
  items: PropertyCardData[];
}) {
  const { t } = useI18n();
  if (!items.length) return null;
  return (
    <section className="mt-20">
      <SectionHead eyebrow={eyebrow} title={title} sub={sub} to="/search" linkLabel={t("home.seeAll")} />
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.slice(0, 4).map((p) => (
          <PropertyCard key={p.id} p={p} />
        ))}
      </div>
    </section>
  );
}

function Home() {
  const { t, lang, localized } = useI18n();
  const { data, isPending } = useQuery(homeQuery());
  const { data: destinations } = useQuery(destinationsQuery());
  const { data: ref } = useQuery(refDataQuery());

  const topDestinations = (destinations ?? [])
    .slice()
    .sort((a, b) => (a.is_popular === b.is_popular ? b.stays - a.stays : a.is_popular ? -1 : 1))
    .slice(0, 8);

  const tours = data?.tours ?? [];

  return (
    <div>
      {/* Hero + search */}
      <section className="relative z-30 border-b border-border/70">
        <div className="absolute inset-0 overflow-hidden">
          <img src={heroImage} alt="Armenian mountain landscape at sunrise" className="size-full object-cover" />
          <div className="hero-fade absolute inset-0" />
        </div>
        <div className="container-page relative z-10 pb-16 pt-24 text-center md:pb-24 md:pt-32">
          <h1 className="mx-auto max-w-4xl font-display text-4xl leading-[1.1] text-background md:text-6xl">
            {t("hero.l1")} {t("hero.l2a")}
            <span className="text-gold drop-shadow-[0_2px_4px_rgba(0,0,0,0.45)]">{t("hero.hl")}</span>
            {t("hero.l2b")}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-background/85">{t("hero.subtitle")}</p>
          <div className="mx-auto mt-10 max-w-4xl text-left">
            <SearchBar />
          </div>
          <ul className="mx-auto mt-8 flex max-w-3xl flex-wrap items-center justify-center gap-2.5">
            {[
              { icon: ShieldCheck, label: t("home.trust1") },
              { icon: PhoneCall, label: t("home.trust2") },
              { icon: CalendarCheck, label: t("home.trust3") },
            ].map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="flex items-center gap-2 rounded-full border border-background/25 bg-background/10 px-4 py-2 text-xs font-medium text-background backdrop-blur-md"
              >
                <Icon className="size-3.5 text-gold" />
                {label}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="container-page relative z-0 pb-8">
        {/* Explore Armenia */}
        {topDestinations.length ? (
          <section className="mt-16">
            <SectionHead
              eyebrow={t("dest.eyebrow")}
              title={t("home.exploreArmenia")}
              sub={t("home.exploreArmeniaSub")}
              to="/destinations"
              linkLabel={t("home.seeAll")}
            />
            <div className="-mx-4 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 [&>a]:w-[72%] [&>a]:shrink-0 [&>a]:snap-start sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4 sm:[&>a]:w-auto">
              {topDestinations.map((c) => (
                <Link
                  key={c.code}
                  to="/search"
                  search={{ destination: localized(c, "name"), guests: 2, page: 1 }}
                  className="group relative overflow-hidden rounded-3xl border border-border/70 bg-card shadow-card transition-shadow hover:shadow-lift"
                >
                  <div className="relative aspect-[5/4] overflow-hidden bg-surface">
                    {c.image_url ? (
                      <img
                        src={c.image_url}
                        alt={localized(c, "name")}
                        loading="lazy"
                        className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center text-muted-foreground">
                        <MapPin className="size-7" />
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/85 via-foreground/25 to-transparent p-4">
                      <h3 className="font-display text-lg text-background">{localized(c, "name")}</h3>
                      <p className="text-xs text-background/80">
                        {c.stays} {c.stays === 1 ? t("dest.stayOne") : t("dest.stays")}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {isPending ? (
          <div className="mt-20">
            <CardGridSkeleton count={4} />
          </div>
        ) : (
          <>
            <Row
              eyebrow={t("home.featuredEyebrow")}
              title={t("home.featured")}
              sub={t("home.featuredSub")}
              items={(data?.recommended ?? []) as PropertyCardData[]}
            />
            <Row
              title={t("home.cabinsGuesthouses")}
              items={[...(data?.cabins ?? []), ...(data?.guesthouses ?? [])] as PropertyCardData[]}
            />
          </>
        )}

        {/* Experiences in Armenia */}
        <section className="mt-24 rounded-4xl bg-surface px-6 py-14 md:px-12">
          <SectionHead
            eyebrow={t("home.experiencesEyebrow")}
            title={t("home.experiences")}
            sub={t("home.experiencesSub")}
            to="/tours"
            linkLabel={t("home.seeAll")}
          />
          <div className="mt-8 flex flex-wrap gap-2.5">
            {(ref?.categories ?? []).map((cat) => (
              <Link
                key={cat.code}
                to="/tours"
                className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-medium shadow-card transition-colors hover:border-brand hover:text-brand"
              >
                <Compass className="size-4 text-brand" />
                {localized(cat, "name")}
              </Link>
            ))}
          </div>

          {tours.length ? (
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {tours.slice(0, 3).map((tour) => (
                <Link
                  key={tour.id}
                  to="/tour/$slug"
                  params={{ slug: tour.slug }}
                  className="group overflow-hidden rounded-3xl border border-border/70 bg-card shadow-card transition-all hover:-translate-y-1 hover:shadow-lift"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-surface">
                    {tour.main_image_url ? (
                      <img
                        src={tour.main_image_url}
                        alt={tour.name}
                        loading="lazy"
                        className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : null}
                    {tour.review_count > 0 ? (
                      <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-card/90 px-2.5 py-1 text-xs font-semibold backdrop-blur">
                        <Star className="size-3 fill-gold text-gold" />
                        {Number(tour.rating).toFixed(1)}
                      </span>
                    ) : null}
                  </div>
                  <div className="space-y-2 p-5">
                    <h3 className="line-clamp-1 font-display text-lg">{tour.name}</h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="size-3.5" />
                        {localized(ref?.cities.find((c) => c.code === tour.city_code), "name") || tour.city_code}
                      </span>
                      {tour.duration_hours ? (
                        <span className="flex items-center gap-1">
                          <Clock className="size-3.5" /> {tour.duration_hours} {t("home.hours")}
                        </span>
                      ) : null}
                    </div>
                    <p className="border-t border-border/70 pt-3 text-sm">
                      <span className="font-display text-lg text-brand">
                        {formatPrice(Number(tour.price), tour.currency ?? "AMD", lang)}
                      </span>
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : null}
        </section>

        {/* Why StayLand */}
        <section className="mt-24">
          <SectionHead eyebrow={t("home.whyEyebrow")} title={t("home.why")} />
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {[
              { icon: ShieldCheck, title: t("home.trust1"), sub: t("home.trust1sub") },
              { icon: PhoneCall, title: t("home.trust2"), sub: t("home.trust2sub") },
              { icon: CalendarCheck, title: t("home.trust3"), sub: t("home.trust3sub") },
            ].map((f) => (
              <div key={f.title} className="rounded-3xl border border-border/70 bg-card p-6 shadow-card">
                <f.icon className="size-6 text-brand" />
                <h3 className="mt-4 font-display text-xl">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.sub}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Become a host */}
        <section className="mt-24 overflow-hidden rounded-4xl bg-highland px-8 py-14 text-center text-highland-foreground md:px-16">
          <h2 className="mx-auto max-w-2xl font-display text-3xl md:text-4xl">{t("home.hostHeadline")}</h2>
          <p className="mx-auto mt-4 max-w-xl text-highland-foreground/80">{t("home.ownerCtaSub")}</p>
          <Link
            to="/owner/properties/new"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-brand px-7 py-3 text-sm font-semibold text-brand-foreground transition-opacity hover:opacity-90"
          >
            {t("home.hostCta")} <ArrowRight className="size-4" />
          </Link>
        </section>

        {/* Recently added */}
        <Row title={t("home.recentlyAdded")} items={(data?.recent ?? []) as PropertyCardData[]} />
      </div>
    </div>
  );
}
