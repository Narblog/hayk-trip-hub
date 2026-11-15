import { staticHead } from "@/lib/page-seo";
import { createFileRoute } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/terms")({
  head: ({ match }) => staticHead("terms", match.search),
  component: TermsPage,
});

function TermsPage() {
  const { t } = useI18n();
  const sections = [
    ["terms.s1", "terms.s1b"],
    ["terms.s2", "terms.s2b"],
    ["terms.s3", "terms.s3b"],
    ["terms.s4", "terms.s4b"],
    ["terms.s5", "terms.s5b"],
  ] as const;

  return (
    <div className="container-page max-w-3xl py-16">
      <p className="eyebrow text-brand">{t("legal.updated")}</p>
      <h1 className="mt-2 font-display text-4xl">{t("terms.title")}</h1>
      <p className="mt-5 text-lg leading-relaxed text-muted-foreground">{t("terms.intro")}</p>
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
