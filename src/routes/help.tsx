import { createFileRoute, Link } from "@tanstack/react-router";
import { Mail, Clock } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "Help & contact — StayLand Armenia" },
      {
        name: "description",
        content:
          "Get help with a stay, a listing or your StayLand account. Travellers contact Armenian hosts directly; hosts list for free.",
      },
      { property: "og:title", content: "StayLand help & contact" },
      { property: "og:description", content: "Support for travellers and hosts on StayLand Armenia." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HelpPage,
});

function HelpPage() {
  const { t } = useI18n();
  return (
    <div className="container-page max-w-3xl py-16">
      <h1 className="font-display text-4xl">{t("help.title")}</h1>
      <p className="mt-5 text-lg leading-relaxed text-muted-foreground">{t("help.intro")}</p>

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        <section className="rounded-3xl border border-border/70 bg-card p-6 shadow-card">
          <h2 className="font-display text-xl">{t("help.guests")}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t("help.guestsB")}</p>
          <Link to="/search" className="mt-4 inline-block text-sm font-semibold text-brand hover:underline">
            {t("nav.stays")}
          </Link>
        </section>
        <section className="rounded-3xl border border-border/70 bg-card p-6 shadow-card">
          <h2 className="font-display text-xl">{t("help.hosts")}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t("help.hostsB")}</p>
          <Link
            to="/owner/properties/new"
            className="mt-4 inline-block text-sm font-semibold text-brand hover:underline"
          >
            {t("nav.listProperty")}
          </Link>
        </section>
      </div>

      <div className="mt-8 rounded-3xl bg-surface p-6">
        <p className="flex items-center gap-2 text-sm">
          <Mail className="size-4 text-brand" />
          <span className="font-semibold">{t("help.email")}:</span>
          <a href="mailto:hello@stayland.am" className="text-brand hover:underline">
            hello@stayland.am
          </a>
        </p>
        <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="size-4" /> {t("help.reply")}
        </p>
      </div>
    </div>
  );
}
