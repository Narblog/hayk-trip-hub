import type { ReactNode } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, Bell, Building2, CalendarDays, Home, UserRound } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { notificationsQuery, profileQuery } from "@/lib/data";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const ITEMS = [
  { to: "/owner", key: "owner.navHome", icon: Home, exact: true },
  { to: "/owner/properties", key: "owner.navProperties", icon: Building2, exact: false },
  { to: "/owner/bookings", key: "owner.navBookings", icon: CalendarDays, exact: false },
  { to: "/owner/analytics", key: "owner.navAnalytics", icon: BarChart3, exact: false },
  { to: "/owner/profile", key: "owner.navProfile", icon: UserRound, exact: false },
  { to: "/account/notifications", key: "owner.navNotifications", icon: Bell, exact: false },
] as const;

export function OwnerShell({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const { user } = useAuth();
  const { pathname } = useLocation();
  const { data: profile } = useQuery(profileQuery(user?.id ?? null));
  const { data: notifications = [] } = useQuery(notificationsQuery(user?.id ?? null));
  const unread = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="container-page py-6 md:py-8">
      <div className="grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="mb-4 hidden items-center gap-3 rounded-2xl border border-border bg-card p-3 lg:flex">
            <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-full bg-surface">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="size-full object-cover" />
              ) : (
                <UserRound className="size-4 text-muted-foreground" />
              )}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">{profile?.full_name || user?.email}</span>
              <span className="block truncate text-xs text-muted-foreground">{t("owner.dashboard")}</span>
            </span>
          </div>
          <nav className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:gap-1 lg:px-0">
            {ITEMS.map((item) => {
              const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium transition",
                    active
                      ? "bg-brand text-brand-foreground shadow-card"
                      : "text-muted-foreground hover:bg-surface hover:text-foreground",
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  <span className="whitespace-nowrap">{t(item.key)}</span>
                  {item.to === "/account/notifications" && unread > 0 ? (
                    <span className="ml-auto rounded-full bg-gold px-1.5 text-[11px] font-semibold text-foreground">{unread}</span>
                  ) : null}
                </Link>
              );
            })}
          </nav>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
