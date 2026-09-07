import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { CalendarClock, CheckCircle2, Eye, Wallet } from "lucide-react";
import { InlineLoader } from "@/components/common/states";
import { OwnerShell } from "@/components/owner/OwnerShell";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import {
  becomeOwner,
  ownerBookingsQuery,
  ownerPropertiesQuery,
  ownerStatsQuery,
  ownerToursQuery,
} from "@/lib/data";
import { formatDate, formatPrice } from "@/lib/format";
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

export function monthRevenue(rows: { status: string; check_in: string; total_price: number; confirmed_total_price: number | null }[]) {
  const now = new Date();
  return rows
    .filter((b) => b.status === "ACCEPTED" || b.status === "COMPLETED")
    .filter((b) => {
      const d = new Date(b.check_in);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    })
    .reduce((s, b) => s + Number(b.confirmed_total_price ?? b.total_price), 0);
}

function OwnerDashboard() {
  const { t, lang } = useI18n();
  const { user, isOwner } = useAuth();
  const queryClient = useQueryClient();
  const [upgrading, setUpgrading] = useState(false);
  const { data: stats } = useQuery(ownerStatsQuery(user?.id ?? null));
  const { data: props, isPending } = useQuery(ownerPropertiesQuery(user?.id ?? null));
  const { data: tours = [], isPending: toursPending } = useQuery(ownerToursQuery(user?.id ?? null));
  const { data: ownerBookings = [] } = useQuery(ownerBookingsQuery(user?.id ?? null));
  const pendingBookings = ownerBookings.filter((b) => b.status === "PENDING").length;
  const acceptedBookings = ownerBookings.filter((b) => b.status === "ACCEPTED").length;
  const revenue = monthRevenue(ownerBookings);

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
    <OwnerShell>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold">{t("owner.dashboard")}</h1>
          <p className="mt-1 text-muted-foreground">{t("book.ownerSub")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild><Link to="/owner/properties/new">{t("owner.addProperty")}</Link></Button>
          <Button asChild variant="outline"><Link to="/owner/tours/new">{t("tourForm.new")}</Link></Button>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<CalendarClock className="size-4" />} tone="gold" label={t("owner.pending")} value={String(pendingBookings)} />
        <StatCard icon={<CheckCircle2 className="size-4" />} tone="brand" label={t("owner.approved")} value={String(acceptedBookings)} />
        <StatCard icon={<Wallet className="size-4" />} tone="brand" label={t("owner.monthRevenue")} value={formatPrice(revenue, "AMD", lang)} />
        <StatCard icon={<Eye className="size-4" />} tone="muted" label={t("owner.views")} value={String(stats?.views ?? 0)} />
      </div>

      <div className="mt-8 flex items-center justify-between gap-3">
        <h2 className="font-display text-xl font-semibold">{t("owner.myProperties")}</h2>
        <Button asChild size="sm" variant="outline"><Link to="/owner/properties">{t("owner.navProperties")}</Link></Button>
      </div>
      {isPending ? (
        <InlineLoader />
      ) : (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {(props ?? []).slice(0, 4).map((p) => (
            <li key={p.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
              <span className="size-14 shrink-0 overflow-hidden rounded-xl bg-surface">
                {p.main_image_url ? <img src={p.main_image_url} alt="" className="size-full object-cover" /> : null}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{p.name}</span>
                <span className="mt-1 block"><StatusBadge status={p.status} /></span>
              </span>
              <Button asChild size="sm" variant="outline">
                <Link to="/owner/properties/$id/calendar" params={{ id: p.id }}>{t("owner.openCalendar")}</Link>
              </Button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl font-semibold">{t("tourForm.myTours")}</h2>
          <Button asChild size="sm" variant="outline"><Link to="/owner/tours/new">{t("tourForm.new")}</Link></Button>
        </div>
        {toursPending ? (
          <InlineLoader />
        ) : tours.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">{t("tourForm.noTours")}</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {tours.map((tr) => (
              <li key={tr.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
                <div className="min-w-0">
                  <p className="truncate font-medium">{tr.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {tr.city_code ?? tr.location ?? "—"} · {formatDate(tr.created_at)}
                  </p>
                </div>
                <StatusBadge status={tr.status} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </OwnerShell>
  );
}

export function StatCard({
  icon,
  label,
  value,
  tone = "brand",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: "brand" | "gold" | "muted";
}) {
  const toneClass =
    tone === "gold" ? "bg-gold/20 text-foreground" : tone === "muted" ? "bg-surface text-muted-foreground" : "bg-brand/10 text-brand";
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
      <span className={`grid size-10 shrink-0 place-items-center rounded-full ${toneClass}`}>{icon}</span>
      <span className="min-w-0">
        <span className="block text-xs text-muted-foreground">{label}</span>
        <span className="block truncate font-display text-xl font-semibold">{value}</span>
      </span>
    </div>
  );
}
