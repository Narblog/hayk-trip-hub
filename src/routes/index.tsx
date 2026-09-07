import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ShieldCheck,
  PhoneCall,
  CalendarCheck,
  ArrowRight,
  Home as HomeIcon,
  CarFront,
  Gift,
} from "lucide-react";
import { CardGridSkeleton } from "@/components/common/states";
import { PropertyCard, type PropertyCardData } from "@/components/property/PropertyCard";
import { PropertyCarousel } from "@/components/property/PropertyCarousel";
import { SearchBar } from "@/components/search/SearchBar";
import { homeQuery } from "@/lib/data";
import { useI18n } from "@/lib/i18n";
import heroImage from "@/assets/hero-armenia.jpg";
import vibeForest from "@/assets/vibe-forest.jpg";
import vibeLake from "@/assets/vibe-lake.jpg";
import vibeJacuzzi from "@/assets/vibe-jacuzzi.jpg";
import vibeFamily from "@/assets/vibe-family.jpg";
import vibeRomantic from "@/assets/vibe-romantic.jpg";
import vibeMountain from "@/assets/vibe-mountain.jpg";
import promoTours from "@/assets/promo-tours.jpg";

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
        <h2 className="mt-1.5 font-display text-2xl md:text-3xl">{title}</h2>
        {sub ? <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">{sub}</p> : null}
      </div>
      {to ? (
        <Link
          to={to}
          className="group hidden shrink-0 items-center gap-1.5 text-sm font-semibold text-foreground transition-colors hover:text-brand sm:flex"
        >
          {linkLabel}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      ) : null}
    </div>
  );
}

function Home() {
  const { t, localized } = useI18n();
  const { data, isPending } = useQuery(homeQuery());
  const { data: ref } = useQuery(refDataQuery());

  const recommended = ((data?.recommended ?? []) as PropertyCardData[]).slice(0, 12);
  const recommendedIds = new Set(recommended.map((p) => p.id));
  const pool = [
    ...((data?.recent ?? []) as PropertyCardData[]),
    ...((data?.all ?? []) as PropertyCardData[]),
  ];
  const seen = new Set<string>();
  const grid: PropertyCardData[] = [];
  for (const p of pool) {
    if (recommendedIds.has(p.id) || seen.has(p.id)) continue;
    seen.add(p.id);
    grid.push(p);
    if (grid.length === 8) break;
  }

  return (
    <div>
      {/* Hero + search */}
      <section className="relative z-30">
        <div className="absolute inset-0 overflow-hidden">
          <img src={heroImage} alt="Armenian mountain landscape at sunrise" className="size-full object-cover" />
          <div className="hero-fade absolute inset-0" />
        </div>
        <div className="container-page relative z-10 pb-12 pt-14 text-center md:pb-16 md:pt-20">
          <h1 className="mx-auto max-w-4xl font-display text-3xl leading-[1.15] text-background md:text-5xl">
            {t("hero.l1")} {t("hero.l2a")}
            <span className="text-gold drop-shadow-[0_2px_4px_rgba(0,0,0,0.45)]">{t("hero.hl")}</span>
            {t("hero.l2b")}
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-base text-background/85">{t("hero.subtitle")}</p>

          <div className="mx-auto mt-6 max-w-4xl">
            <div className="mx-auto flex w-fit items-center gap-1 rounded-t-3xl bg-card/95 px-2 pt-2 shadow-search backdrop-blur">
              <span className="flex items-center gap-2 rounded-t-2xl border-b-2 border-brand bg-card px-5 py-2.5 text-sm font-semibold text-foreground">
                <HomeIcon className="size-4 text-brand" />
                {t("home.tabStays")}
              </span>
              <Link
                to="/tours"
                className="flex items-center gap-2 rounded-t-2xl border-b-2 border-transparent px-5 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <CarFront className="size-4" />
                {t("home.tabTours")}
              </Link>
              <Link
                to="/tours"
                className="flex items-center gap-2 rounded-t-2xl border-b-2 border-transparent px-5 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <Gift className="size-4" />
                {t("home.tabPackages")}
              </Link>
            </div>
            <div className="text-left">
              <SearchBar />
            </div>
          </div>
        </div>
      </section>

      <div className="container-page relative z-0 pb-10">
        {/* Category chips */}
        {(ref?.types ?? []).length ? (
          <div className="scrollbar-none -mx-4 mt-8 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
            {(ref?.types ?? []).map((type) => (
              <Link
                key={type.code}
                to="/search"
                search={{ guests: 2, page: 1, types: [type.code] }}
                className="shrink-0 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium shadow-card transition-colors hover:border-brand hover:text-brand"
              >
                {localized(type, "name")}
              </Link>
            ))}
          </div>
        ) : null}

        {/* Recommended carousel */}
        <section className="mt-10">
          <SectionHead
            eyebrow={t("home.featuredEyebrow")}
            title={t("home.featured")}
            sub={t("home.featuredSub")}
            to="/search"
            linkLabel={t("home.seeAll")}
          />
          <div className="mt-5">
            {isPending ? <CardGridSkeleton count={4} /> : <PropertyCarousel items={recommended} />}
          </div>
        </section>

        {/* Stays grid */}
        <section className="mt-12">
          <SectionHead title={t("home.stays")} sub={t("home.staysSub")} />
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {isPending ? null : grid.map((p) => <PropertyCard key={p.id} p={p} compact />)}
          </div>
          {isPending ? <CardGridSkeleton count={8} /> : null}
          <div className="mt-7 flex justify-center">
            <Link
              to="/search"
              search={{ guests: 2, page: 1 }}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold shadow-card transition-colors hover:border-brand hover:text-brand"
            >
              {t("home.seeAllStays")}
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>

        {/* Compact tours banner */}
        <section className="relative mt-12 overflow-hidden rounded-3xl shadow-card">
          <img
            src={promoTours}
            alt={t("home.promoToursTitle")}
            loading="lazy"
            className="absolute inset-0 size-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/75 via-foreground/40 to-transparent" />
          <div className="relative flex min-h-40 flex-col items-start justify-center gap-1.5 p-6 md:p-8">
            <h3 className="max-w-md font-display text-xl text-background md:text-2xl">{t("home.promoToursTitle")}</h3>
            <p className="max-w-md text-sm text-background/85">{t("home.promoToursSub")}</p>
            <Link
              to="/tours"
              className="mt-3 inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground transition-opacity hover:opacity-90"
            >
              {t("home.promoToursCta")} <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>

        {/* Why StayLand */}
        <section className="mt-12">
          <SectionHead eyebrow={t("home.whyEyebrow")} title={t("home.why")} />
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {[
              { icon: ShieldCheck, title: t("home.trust1"), sub: t("home.trust1sub") },
              { icon: PhoneCall, title: t("home.trust2"), sub: t("home.trust2sub") },
              { icon: CalendarCheck, title: t("home.trust3"), sub: t("home.trust3sub") },
            ].map((f) => (
              <div key={f.title} className="rounded-2xl border border-border/70 bg-card p-5 shadow-card">
                <f.icon className="size-5 text-brand" />
                <h3 className="mt-3 font-display text-lg">{f.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{f.sub}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
