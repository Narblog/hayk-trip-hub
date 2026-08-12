import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { adminStatsQuery } from "@/lib/data";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Admin — Hyur Armenia" },
      { name: "description", content: "Moderate listings, owners and tours across the Hyur Armenia platform." },
      { property: "og:title", content: "Admin — Hyur" },
      { property: "og:description", content: "Platform moderation overview." },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { t } = useI18n();
  const { isAdmin } = useAuth();
  const { data } = useQuery({ ...adminStatsQuery(), enabled: isAdmin });

  if (!isAdmin)
    return <div className="container-page py-16 text-center text-muted-foreground">{t("error.title")}</div>;

  return (
    <div className="container-page py-10">
      <h1 className="font-display text-3xl font-semibold">{t("admin.overview")}</h1>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          [t("admin.totalUsers"), data?.users ?? 0],
          [t("admin.totalProperties"), data?.properties ?? 0],
          [t("admin.pending"), data?.pending ?? 0],
          [t("admin.totalTours"), data?.tours ?? 0],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-2xl border border-border bg-card p-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className="mt-1 font-display text-2xl font-semibold">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
