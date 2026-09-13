import { createFileRoute } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "StayLand-ի մասին — Հայկական կացարաններ և փորձառություններ" },
      { name: "description", content: "StayLand-ը կապում է ճանապարհորդներին Հայաստանի հյուրատների, տնակների, վիլաների և տեղական տուր օպերատորների հետ։" },
      { property: "og:title", content: "StayLand-ի մասին" },
      { property: "og:description", content: "Հայկական հյուրընկալություն՝ ներկայացված հենց տանտերերի կողմից։" },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://hayk-trip-hub.lovable.app/about" },
    ],
    links: [{ rel: "canonical", href: "https://hayk-trip-hub.lovable.app/about" }],
  }),
  component: AboutPage,
});

function AboutPage() {
  const { t } = useI18n();
  return (
    <div className="container-page max-w-3xl py-16">
      <h1 className="font-display text-4xl font-semibold">{t("about.title")}</h1>
      <p className="mt-6 text-lg leading-relaxed text-muted-foreground">{t("hero.subtitle")}</p>
      <div className="mt-10 grid gap-6 sm:grid-cols-3">
        {[
          [t("home.trust1"), t("home.trust1sub")],
          [t("home.trust2"), t("home.trust2sub")],
          [t("home.trust3"), t("home.trust3sub")],
        ].map(([title, sub]) => (
          <div key={title} className="rounded-2xl border border-border bg-card p-5">
            <p className="font-display text-lg font-semibold">{title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}