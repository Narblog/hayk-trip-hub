import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AnalyticsPanel } from "@/components/analytics/AnalyticsPanel";
import { OwnerShell } from "@/components/owner/OwnerShell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { ownerPropertiesQuery } from "@/lib/data";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/owner/analytics")({
  head: () => ({
    meta: [
      { title: "Host analytics — StayLand Armenia" },
      { name: "description", content: "Track views, guest contacts and booking performance for your Armenian stays." },
      { property: "og:title", content: "Host analytics — StayLand" },
      { property: "og:description", content: "Performance insights for your StayLand listings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OwnerAnalyticsPage,
});

function OwnerAnalyticsPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { data: props = [] } = useQuery(ownerPropertiesQuery(user?.id ?? null));

  if (!user)
    return (
      <div className="container-page py-16 text-center">
        <Button asChild><Link to="/auth">{t("nav.login")}</Link></Button>
      </div>
    );

  return (
    <OwnerShell>
      <h1 className="font-display text-3xl font-semibold">{t("owner.analyticsTitle")}</h1>
      <p className="mt-1 text-muted-foreground">{t("owner.analyticsSub")}</p>
      <AnalyticsPanel ownerId={user.id} properties={props.map((p) => ({ id: p.id, name: p.name }))} />
    </OwnerShell>
  );
}
