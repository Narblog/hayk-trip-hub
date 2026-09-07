import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays } from "lucide-react";
import { EmptyState, InlineLoader } from "@/components/common/states";
import { OwnerShell } from "@/components/owner/OwnerShell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { ownerPropertiesQuery } from "@/lib/data";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/owner/calendar")({
  head: () => ({
    meta: [
      { title: "Availability calendars — StayLand Armenia" },
      { name: "description", content: "Pick one of your Armenian stays and manage its availability calendar." },
      { property: "og:title", content: "Availability calendars — StayLand" },
      { property: "og:description", content: "Keep every listing's calendar accurate." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OwnerCalendarPage,
});

function OwnerCalendarPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { data: props = [], isPending } = useQuery(ownerPropertiesQuery(user?.id ?? null));

  if (!user)
    return (
      <div className="container-page py-16 text-center">
        <Button asChild><Link to="/auth">{t("nav.login")}</Link></Button>
      </div>
    );

  return (
    <OwnerShell>
      <h1 className="font-display text-3xl font-semibold">{t("owner.navCalendar")}</h1>
      <p className="mt-1 text-muted-foreground">{t("owner.calendarSub")}</p>

      {isPending ? (
        <InlineLoader />
      ) : props.length === 0 ? (
        <EmptyState title={t("owner.noProperties")} />
      ) : (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {props.map((p) => (
            <li key={p.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
              <span className="size-14 shrink-0 overflow-hidden rounded-xl bg-surface">
                {p.main_image_url ? <img src={p.main_image_url} alt="" className="size-full object-cover" /> : null}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{p.name}</p>
                <p className="text-xs text-muted-foreground">{p.city_code}</p>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link to="/owner/properties/$id/calendar" params={{ id: p.id }}>
                  <CalendarDays className="size-4" /> {t("owner.navCalendar")}
                </Link>
              </Button>
            </li>
          ))}
        </ul>
      )}
    </OwnerShell>
  );
}
