import { createFileRoute } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Գաղտնիության քաղաքականություն — StayLand Հայաստան" },
      {
        name: "description",
        content:
          "Ինչ տվյալներ է հավաքում StayLand-ը, ինչպես են աշխատում անանուն վիճակագրությունները և ինչպես են օգտատերերը կառավարում իրենց տվյալները։",
      },
      { property: "og:title", content: "StayLand գաղտնիության քաղաքականություն" },
      { property: "og:description", content: "Նվազագույն տվյալներ, անանուն վիճակագրություն, անձնական տվյալների չվաճառք։" },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "https://hayk-trip-hub.lovable.app/privacy" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://hayk-trip-hub.lovable.app/privacy" }],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  const { t } = useI18n();
  const sections = [
    ["privacy.s1", "privacy.s1b"],
    ["privacy.s2", "privacy.s2b"],
    ["privacy.s3", "privacy.s3b"],
    ["privacy.s4", "privacy.s4b"],
  ] as const;

  return (
    <div className="container-page max-w-3xl py-16">
      <p className="eyebrow text-brand">{t("legal.updated")}</p>
      <h1 className="mt-2 font-display text-4xl">{t("privacy.title")}</h1>
      <p className="mt-5 text-lg leading-relaxed text-muted-foreground">{t("privacy.intro")}</p>
      <div className="mt-10 space-y-6">
        {sections.map(([title, body]) => (
          <section key={title} className="rounded-3xl border border-border/70 bg-card p-6 shadow-card">
            <h2 className="font-display text-xl">{t(title)}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(body)}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
