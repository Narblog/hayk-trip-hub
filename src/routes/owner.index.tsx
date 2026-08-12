import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { InlineLoader } from "@/components/common/states";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { ownerPropertiesQuery, ownerStatsQuery } from "@/lib/data";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/owner/")({
  head: () => ({
    meta: [
      { title: "Owner dashboard — Hyur Armenia" },
      { name: "description", content: "Manage your Armenian property listings, availability and traveller enquiries." },
      { property: "og:title", content: "Owner dashboard — Hyur" },
      { property: "og:description", content: "Manage your Armenian listings on Hyur." },
    ],
  }),
  component: OwnerDashboard,
});

function OwnerDashboard() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { data: stats } = useQuery(ownerStatsQuery(user?.id ?? null));
  const { data: props, isPending } = useQuery(ownerPropertiesQuery(user?.id ?? null));

  if (!user)
    return (
      <div className="container-page py-16 text-center">
        <Button asChild><Link to="/auth">{t("nav.login")}</Link></Button>
      </div>
    );

  return (
    <div className="container-page py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-semibold">{t("owner.dashboard")}</h1>
        <Button asChild><Link to="/owner/properties/new">{t("owner.addProperty")}</Link></Button>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          [t("owner.total"), stats?.total ?? 0],
          [t("owner.approved"), stats?.approved ?? 0],
          [t("owner.pending"), stats?.pending ?? 0],
          [t("owner.views"), stats?.views ?? 0],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-2xl border border-border bg-card p-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className="mt-1 font-display text-2xl font-semibold">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <h2 className="font-display text-xl font-semibold">{t("owner.myProperties")}</h2>
        {isPending ? (
          <InlineLoader />
        ) : (
          <ul className="mt-4 space-y-2">
            {(props ?? []).map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
                <div className="min-w-0">
                  <p className="truncate font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.city_code}</p>
                </div>
                <StatusBadge status={p.status} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
