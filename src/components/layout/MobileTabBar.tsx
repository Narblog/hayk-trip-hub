import { Link } from "@tanstack/react-router";
import { Heart, Home, Map, Search, User } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function MobileTabBar() {
  const { t } = useI18n();
  const items = [
    { to: "/" as const, icon: Home, label: t("nav.home") },
    { to: "/search" as const, icon: Search, label: t("nav.search") },
    { to: "/tours" as const, icon: Map, label: t("nav.tours") },
    { to: "/favorites" as const, icon: Heart, label: t("nav.favorites") },
    { to: "/account" as const, icon: User, label: t("nav.account") },
  ];
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
      <ul className="grid grid-cols-5">
        {items.map((item) => (
          <li key={item.to}>
            <Link
              to={item.to}
              className="flex flex-col items-center gap-1 py-2.5 text-[10px] text-muted-foreground"
              activeOptions={{ exact: item.to === "/" }}
              activeProps={{ className: "text-brand" }}
            >
              <item.icon className="size-5" />
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}