import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AnalyticsPanel } from "@/components/analytics/AnalyticsPanel";
import { InlineLoader } from "@/components/common/states";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import {
  becomeOwner,
  ownerPropertiesQuery,
  ownerStatsQuery,
  ownerStatusHistoryQuery,
  ownerToursQuery,
} from "@/lib/data";
import { formatDate } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/owner/")({
  head: () => ({
    meta: [
      { title: "Owner dashboard — StayLand Armenia" },
      { name: "description", content: "Manage your Armenian property listings, availability and traveller enquiries." },
      { property: "og:title", content: "Owner dashboard — StayLand" },
      { property: "og:description", content: "Manage your Armenian listings on StayLand." },
    ],
  }),
  component: OwnerDashboard,
});

function OwnerDashboard() {
  const { t } = useI18n();
  const { user, isOwner } = useAuth();
  const queryClient = useQueryClient();
  const [upgrading, setUpgrading] = useState(false);
  const { data: stats } = useQuery(ownerStatsQuery(user?.id ?? null));
  const { data: props, isPending } = useQuery(ownerPropertiesQuery(user?.id ?? null));
  const { data: history = [] } = useQuery(ownerStatusHistoryQuery((props ?? []).map((p) => p.id)));
  const { data: tours = [], isPending: toursPending } = useQuery(ownerToursQuery(user?.id ?? null));

  if (!user)
    return (
      <div className="container-page py-16 text-center">
        <Button asChild><Link to="/auth">{t("nav.login")}</Link></Button>
      </div>
    );

  if (!isOwner)
    return (
      <div className="container-page max-w-xl py-20 text-center">
        <h1 className="font-display text-3xl font-semibold">{t("owner.notHostTitle")}</h1>
        <p className="mt-3 text-muted-foreground">{t("owner.notHostSub")}</p>
        <Button
          className="mt-6"
          disabled={upgrading}
          onClick={async () => {
            setUpgrading(true);
            try {
              await becomeOwner();
              await queryClient.invalidateQueries({ queryKey: ["roles"] });
              toast.success(t("owner.becameHost"));
            } catch (e) {
              toast.error(e instanceof Error ? e.message : String(e));
            } finally {
              setUpgrading(false);
            }
          }}
        >
          {t("owner.becomeHost")}
        </Button>
      </div>
    );

  return (
    <div className="container-page py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-semibold">{t("owner.dashboard")}</h1>
        <div className="flex flex-wrap gap-2">
          <Button asChild><Link to="/owner/properties/new">{t("owner.addProperty")}</Link></Button>
          <Button asChild variant="outline"><Link to="/owner/bookings">{t("book.open")}</Link></Button>
          <Button asChild variant="outline"><Link to="/owner/tours/new">{t("tourForm.new")}</Link></Button>
        </div>

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
              <li key={p.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.city_code}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <StatusBadge status={p.status} />
                    <Button asChild size="sm">
                      <Link to="/owner/properties/$id/edit" params={{ id: p.id }}>
                        {t("owner.edit")}
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link to="/owner/properties/$id/calendar" params={{ id: p.id }}>
                        {t("owner.openCalendar")}
                      </Link>
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
                            {h.note ? (
                              <span className="text-muted-foreground">
                                · {t("owner.historyNote")}: {h.note}
                              </span>
                            ) : null}
                          </li>
                        ))}
                    </ol>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <AnalyticsPanel
        ownerId={user.id}
        properties={(props ?? []).map((p) => ({ id: p.id, name: p.name }))}
      />

      <div className="mt-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl font-semibold">{t("tourForm.myTours")}</h2>
          <Button asChild size="sm" variant="outline">
            <Link to="/owner/tours/new">{t("tourForm.new")}</Link>
          </Button>
        </div>
        {toursPending ? (
          <InlineLoader />
        ) : tours.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">{t("tourForm.noTours")}</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {tours.map((tr) => (
              <li
                key={tr.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{tr.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {tr.city_code ?? tr.location ?? "—"} · {formatDate(tr.created_at)}
                  </p>
                  {tr.admin_note ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t("owner.historyNote")}: {tr.admin_note}
                    </p>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <StatusBadge status={tr.status} />
                  {tr.status === "APPROVED" ? (
                    <Button asChild size="sm" variant="outline">
                      <Link to="/tour/$slug" params={{ slug: tr.slug }}>
                        {t("admin.review")}
                      </Link>
                    </Button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
