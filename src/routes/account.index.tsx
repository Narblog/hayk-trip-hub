import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { profileQuery } from "@/lib/data";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/account/")({
  head: () => ({
    meta: [
      { title: "My account — StayLand Armenia" },
      { name: "description", content: "Manage your StayLand profile, saved stays and notifications." },
      { property: "og:title", content: "My account — StayLand" },
      { property: "og:description", content: "Manage your StayLand travel profile." },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { data: profile } = useQuery(profileQuery(user?.id ?? null));

  if (!user)
    return (
      <div className="container-page py-16 text-center">
        <p className="font-display text-xl">{t("auth.loginTitle")}</p>
        <Button asChild className="mt-4"><Link to="/auth">{t("nav.login")}</Link></Button>
      </div>
    );

  return (
    <div className="container-page max-w-2xl py-10">
      <h1 className="font-display text-3xl font-semibold">{t("account.title")}</h1>
      <div className="mt-6 space-y-2 rounded-2xl border border-border bg-card p-6">
        <p className="font-display text-lg">{profile?.full_name || user.email}</p>
        <p className="text-sm text-muted-foreground">{user.email}</p>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <Button asChild variant="outline"><Link to="/favorites">{t("nav.favorites")}</Link></Button>
        <Button asChild variant="outline"><Link to="/account/notifications">{t("notif.title")}</Link></Button>
      </div>
    </div>
  );
}
