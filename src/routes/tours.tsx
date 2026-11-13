import { createFileRoute, Link } from "@tanstack/react-router";
import { Compass } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/tours")({
  head: () => ({
    meta: [
      { title: "Տուրեր և փորձառություններ Հայաստանում — StayLand" },
      {
        name: "description",
        content: "Օրվա տուրեր, արշավներ, գինու երթուղիներ և մշակութային փորձառություններ տեղական հայ գիդերի ուղեկցությամբ։",
      },
      { property: "og:title", content: "Տուրեր և փորձառություններ Հայաստանում" },
      { property: "og:description", content: "Ամրագրեք հայկական տուրեր տեղական գիդերի ուղեկցությամբ։" },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://www.stayland.am/tours" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://www.stayland.am/tours" }],
  }),
  component: ToursPage,
});

function ToursPage() {
  const { t } = useI18n();

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/70">
        <div className="absolute inset-0">
          <img src="/images/demo/tour-hike.jpg" alt="" className="size-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-foreground/70 via-foreground/45 to-background" />
        </div>
        <div className="container-page relative z-10 py-16 text-center md:py-24">
          <p className="eyebrow text-background/85">{t("nav.tours")}</p>
          <h1 className="mx-auto mt-4 max-w-3xl font-display text-4xl text-background drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)] md:text-5xl">
            {t("tours.heroTitle")}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-background/90 drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)]">
            {t("tours.heroSubtitle")}
          </p>
        </div>
      </section>

      <div className="container-page py-12 md:py-16">
        <div className="mx-auto max-w-xl rounded-3xl border border-border bg-card p-8 text-center shadow-card md:p-10">
          <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <Compass className="size-6" />
          </span>
          <span className="mt-5 inline-flex items-center rounded-full bg-destructive px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-destructive-foreground">
            {t("tours.soonBadge")}
          </span>
          <h2 className="mt-4 font-display text-2xl font-semibold leading-snug md:text-3xl">
            {t("tours.soonTitle")}
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground md:text-base">{t("tours.soonSub")}</p>
          <Link
            to="/search"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-brand-foreground transition-opacity hover:opacity-90"
          >
            {t("tours.backToStays")}
          </Link>
        </div>
      </div>
    </div>
  );
}
