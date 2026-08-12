import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/owner/properties/new")({
  head: () => ({
    meta: [
      { title: "List your property in Armenia — Hyur" },
      { name: "description", content: "Publish your Armenian hotel, guesthouse, cabin, villa or apartment and reach travellers directly." },
      { property: "og:title", content: "List your property — Hyur" },
      { property: "og:description", content: "Reach travellers looking for Armenian stays." },
    ],
  }),
  component: NewPropertyPage,
});

function NewPropertyPage() {
  const { t } = useI18n();
  return (
    <div className="container-page max-w-2xl py-16 text-center">
      <h1 className="font-display text-3xl font-semibold">{t("nav.listProperty")}</h1>
      <p className="mt-3 text-muted-foreground">{t("home.ownerCtaSub")}</p>
      <Button asChild className="mt-6"><Link to="/owner">{t("owner.dashboard")}</Link></Button>
    </div>
  );
}
