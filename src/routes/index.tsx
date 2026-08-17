import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck, PhoneCall, CalendarCheck } from "lucide-react";
import { CardGridSkeleton } from "@/components/common/states";
import { PropertyCard, type PropertyCardData } from "@/components/property/PropertyCard";
import { SearchBar } from "@/components/search/SearchBar";
import { homeQuery } from "@/lib/data";
import { useI18n } from "@/lib/i18n";
import heroImage from "@/assets/hero-armenia.jpg";

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

function Row({ title, eyebrow, items }: { title: string; eyebrow?: string; items: PropertyCardData[] }) {
  const { t } = useI18n();
  if (!items.length) return null;
  return (
    <section className="mt-20">
      <div className="flex items-end justify-between gap-4">
        <div>
          {eyebrow ? <p className="eyebrow text-brand">{eyebrow}</p> : null}
          <h2 className="mt-2 font-display text-3xl md:text-4xl">{title}</h2>
        </div>
        <Link
          to="/search"
          className="shrink-0 rounded-full border border-border px-4 py-2 text-sm font-semibold transition-colors hover:border-brand hover:text-brand"
        >
          {t("home.seeAll")}
        </Link>
      </div>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
      <section className="relative z-30 border-b border-border/70">
        <div className="absolute inset-0 overflow-hidden">
          <img
            src={heroImage}
            alt="Armenian mountain landscape at sunrise"
            className="size-full object-cover"
          />
          <div className="hero-fade absolute inset-0" />
        </div>
        <div className="container-page relative z-10 pb-16 pt-24 text-center md:pb-24 md:pt-32">
          <p className="eyebrow text-background/80">{t("home.staysEyebrow")}</p>
          <h1 className="mx-auto mt-4 max-w-4xl font-display text-4xl leading-[1.1] text-background md:text-6xl">
            {t("hero.l1")}
            <br />
            {t("hero.l2a")}
            <span className="text-gold drop-shadow-[0_2px_4px_rgba(0,0,0,0.45)]">{t("hero.hl")}</span>
            {t("hero.l2b")}
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-background/85">{t("hero.subtitle")}</p>
          <div className="mx-auto mt-10 max-w-4xl text-left">
            <SearchBar />
          </div>
        </div>
      </section>

      <div className="container-page relative z-0 pb-8">
        <section className="mt-16 grid gap-6 md:grid-cols-3">
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
        </section>

        {data?.cities?.length ? (
          <section className="mt-20">
            <p className="eyebrow text-brand">{t("home.experiencesEyebrow")}</p>
            <h2 className="mt-2 font-display text-3xl md:text-4xl">{t("home.popularDestinations")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("home.popularDestinationsSub")}</p>
            <div className="mt-6 flex flex-wrap gap-2.5">
              {data.cities.map((c) => (
                <Link
                  key={c.code}
                  to="/search"
                  search={{ destination: localized(c, "name"), guests: 2, page: 1 }}
                  className="rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium shadow-card transition-colors hover:border-brand hover:text-brand"
                >
                  {localized(c, "name")}
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
              title={t("home.staysTitle")}
              items={(data?.recommended ?? []) as PropertyCardData[]}
            />
            <Row title={t("home.guesthouses")} items={(data?.guesthouses ?? []) as PropertyCardData[]} />
            <Row title={t("home.cabins")} items={(data?.cabins ?? []) as PropertyCardData[]} />
            <Row title={t("home.hotels")} items={(data?.hotels ?? []) as PropertyCardData[]} />
          </>
        )}

        <section className="mt-24 overflow-hidden rounded-4xl bg-highland px-8 py-14 text-center text-highland-foreground md:px-16">
          <h2 className="mx-auto max-w-2xl font-display text-3xl md:text-4xl">{t("home.ownerCta")}</h2>
          <p className="mx-auto mt-4 max-w-xl text-highland-foreground/80">{t("home.ownerCtaSub")}</p>
          <Link
            to="/owner/properties/new"
            className="mt-8 inline-flex rounded-full bg-brand px-7 py-3 text-sm font-semibold text-brand-foreground transition-opacity hover:opacity-90"
          >
            {t("nav.listProperty")}
          </Link>
        </section>
      </div>
    </div>
  );
}
