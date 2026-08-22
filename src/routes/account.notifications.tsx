import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { EmptyState, InlineLoader } from "@/components/common/states";
import { useAuth } from "@/lib/auth";
import { notificationsQuery } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/account/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — StayLand Armenia" },
      { name: "description", content: "Updates about your listings, reviews and saved stays on StayLand." },
      { property: "og:title", content: "Notifications — StayLand" },
      { property: "og:description", content: "Your StayLand account updates." },
    ],
  }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const { data, isPending } = useQuery(notificationsQuery(user?.id ?? null));

  return (
    <div className="container-page max-w-2xl py-10">
      <h1 className="font-display text-3xl font-semibold">{t("notif.title")}</h1>
      <div className="mt-6">
        {isPending && user ? (
          <InlineLoader />
        ) : !data || data.length === 0 ? (
          <EmptyState title={t("notif.empty")} />
        ) : (
          <ul className="space-y-2">
            {data.map((n) => (
              <li key={n.id} className="rounded-xl border border-border bg-card p-4">
                <p className="font-medium">{n.title}</p>
                <p className="text-sm text-muted-foreground">{n.body}</p>
                <p className="mt-1 text-xs text-muted-foreground">{formatDate(n.created_at, lang)}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
