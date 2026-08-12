import { createFileRoute } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Hyur — Armenian stays and experiences" },
      { name: "description", content: "Hyur connects travellers with Armenian hotels, guesthouses, cabins, villas and local tour operators." },
      { property: "og:title", content: "About Hyur" },
      { property: "og:description", content: "Armenian hospitality, listed by the people who host it." },
    ],
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