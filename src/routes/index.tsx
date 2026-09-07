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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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

function Vibes() {
  const { t } = useI18n();
  const vibes = [
    { img: vibeForest, label: t("vibe.forest"), search: { guests: 2, page: 1, amenities: ["forest_view"] } as const },
    { img: vibeLake, label: t("vibe.lake"), search: { guests: 2, page: 1, amenities: ["lake_view"] } as const },
    { img: vibeJacuzzi, label: t("vibe.jacuzzi"), search: { guests: 2, page: 1, amenities: ["jacuzzi"] } as const },
    { img: vibeFamily, label: t("vibe.family"), search: { guests: 2, page: 1 } as const },
    { img: vibeRomantic, label: t("vibe.romantic"), search: { guests: 2, page: 1, amenities: ["fireplace"] } as const },
    { img: vibeMountain, label: t("vibe.mountain"), search: { guests: 2, page: 1, amenities: ["mountain_view"] } as const },
  ];
  return (
    <section className="mt-8 md:mt-10">
      <h2 className="font-display text-xl md:text-2xl">{t("home.vibes")}</h2>
      <div className="scrollbar-none -mx-4 mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-6">
        {vibes.map((v) => (
          <Link
            key={v.label}
            to="/search"
            search={v.search}
            className="group relative w-36 shrink-0 snap-start overflow-hidden rounded-2xl shadow-card transition-shadow hover:shadow-lift sm:w-auto"
          >
            <div className="relative aspect-[16/10] overflow-hidden">
              <img
                src={v.img}
                alt={v.label}
                loading="lazy"
                width={640}
                height={400}
                className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-foreground/10 to-transparent" />
              <p className="absolute inset-x-0 bottom-0 p-2.5 text-center text-sm font-semibold text-background drop-shadow">
                {v.label}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function Home() {
  const { t } = useI18n();
  const { data, isPending } = useQuery(homeQuery());

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
    if (grid.length === 12) break;
  }

  return (
    <div>
      {/* Hero + search */}
      <section className="relative z-30">
        <div className="absolute inset-0 overflow-hidden">
          <img src={heroImage} alt="Armenian mountain landscape at sunrise" className="size-full object-cover" />
          <div className="hero-fade absolute inset-0" />
        </div>
        <div className="container-page relative z-10 pb-14 pt-20 text-center md:pb-16 md:pt-24">
          <h1 className="mx-auto max-w-4xl font-display text-[1.65rem] leading-[1.2] text-background [text-shadow:0_1px_12px_rgba(0,0,0,0.55)] md:text-5xl md:leading-[1.15]">
            {t("hero.l1")} {t("hero.l2a")}
            <span className="text-gold drop-shadow-[0_2px_4px_rgba(0,0,0,0.45)]">{t("hero.hl")}</span>
            {t("hero.l2b")}
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-background [text-shadow:0_1px_8px_rgba(0,0,0,0.6)] md:text-base">{t("hero.subtitle")}</p>

          <div className="mx-auto mt-10 max-w-4xl md:mt-12">
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
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-t-2xl border-b-2 border-transparent px-5 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <Gift className="size-4" />
                    {t("home.tabPackages")}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-72 rounded-2xl" side="bottom" align="center">
                  <div className="flex items-start gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-soft text-brand">
                      <Gift className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{t("home.packagesSoonTitle")}</p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t("home.packagesSoonSub")}</p>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div className="text-left">
              <SearchBar />
            </div>
          </div>
        </div>
      </section>

      <div className="container-page relative z-0 pb-10">
        {/* Vibe chips */}
        <Vibes />

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
