import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { EmptyState, InlineLoader } from "@/components/common/states";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { markAllNotificationsRead, notificationsQuery } from "@/lib/data";
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
  const router = useRouter();
  const qc = useQueryClient();
  const { data, isPending } = useQuery(notificationsQuery(user?.id ?? null));

  const hasUnread = (data ?? []).some((n) => !n.is_read);

  const markAll = useMutation({
    mutationFn: async () => {
      if (!user) return;
      await markAllNotificationsRead(user.id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications", user?.id ?? null] });
      toast.success(t("notif.markAllRead"));
    },
  });

  return (
    <div className="container-page max-w-2xl py-10">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-10 shrink-0 rounded-full"
            aria-label={t("notif.back")}
            onClick={() => router.history.back()}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <h1 className="truncate font-display text-3xl font-semibold">{t("notif.title")}</h1>
        </div>
        {hasUnread ? (
          <Button
            type="button"
            variant="outline"
            className="shrink-0 rounded-full"
            disabled={markAll.isPending}
            onClick={() => markAll.mutate()}
          >
            <CheckCheck className="size-4" />
            {t("notif.markAllRead")}
          </Button>
        ) : null}
      </div>
      <div className="mt-6">
        {isPending && user ? (
          <InlineLoader />
        ) : !data || data.length === 0 ? (
          <EmptyState title={t("notif.empty")} />
        ) : (
          <ul className="space-y-2">
            {data.map((n) => (
              <li
                key={n.id}
                className={`rounded-xl border border-border bg-card p-4 ${n.is_read ? "opacity-70" : ""}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium">{n.title}</p>
                  {!n.is_read ? <span className="mt-1.5 size-2 shrink-0 rounded-full bg-brand" aria-hidden="true" /> : null}
                </div>
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
