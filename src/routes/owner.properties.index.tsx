import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { InlineLoader } from "@/components/common/states";
import { OwnerShell } from "@/components/owner/OwnerShell";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { ownerPropertiesQuery, ownerStatusHistoryQuery } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/owner/properties/")({
  head: () => ({
    meta: [
      { title: "My listings — StayLand Armenia" },
      { name: "description", content: "Edit, price and manage availability for every stay you host on StayLand." },
      { property: "og:title", content: "My listings — StayLand" },
      { property: "og:description", content: "All your Armenian stays in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OwnerPropertiesPage,
});

function OwnerPropertiesPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { data: props = [], isPending } = useQuery(ownerPropertiesQuery(user?.id ?? null));
  const { data: history = [] } = useQuery(ownerStatusHistoryQuery(props.map((p) => p.id)));

  if (!user)
    return (
      <div className="container-page py-16 text-center">
        <Button asChild><Link to="/auth">{t("nav.login")}</Link></Button>
      </div>
    );

  return (
    <OwnerShell>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-semibold">{t("owner.myProperties")}</h1>
        <Button asChild><Link to="/owner/properties/new">{t("owner.addProperty")}</Link></Button>
      </div>

      {isPending ? (
        <InlineLoader />
      ) : (
        <ul className="mt-6 space-y-3">
          {props.map((p) => (
            <li key={p.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="size-16 shrink-0 overflow-hidden rounded-xl bg-surface">
                  {p.main_image_url ? <img src={p.main_image_url} alt="" className="size-full object-cover" /> : null}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.city_code}</p>
                  <div className="mt-1"><StatusBadge status={p.status} /></div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button asChild size="sm"><Link to="/owner/properties/$id/edit" params={{ id: p.id }}>{t("owner.edit")}</Link></Button>
                  <Button asChild size="sm" variant="outline">
                    <Link to="/owner/properties/$id/calendar" params={{ id: p.id }}>{t("owner.navCalendar")}</Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link to="/owner/properties/$id/pricing" params={{ id: p.id }}>{t("owner.navPrices")}</Link>
                  </Button>
                </div>
              </div>
              <div className="mt-3 border-t border-border/70 pt-3">
                <p className="eyebrow text-[11px] text-muted-foreground">{t("owner.history")}</p>
                {history.filter((h) => h.property_id === p.id).length === 0 ? (
                  <p className="mt-1 text-xs text-muted-foreground">{t("owner.historyEmpty")}</p>
                ) : (
                  <ol className="mt-2 space-y-2">
                    {history
                      .filter((h) => h.property_id === p.id)
                      .slice(0, 4)
                      .map((h) => (
                        <li key={h.id} className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="text-muted-foreground">{formatDate(h.created_at)}</span>
                          {h.old_status ? (
                            <>
                              <StatusBadge status={h.old_status} />
                              <span className="text-muted-foreground">→</span>
                            </>
                          ) : null}
                          <StatusBadge status={h.new_status} />
                          {h.note ? <span className="text-muted-foreground">· {h.note}</span> : null}
                        </li>
                      ))}
                  </ol>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </OwnerShell>
  );
}
