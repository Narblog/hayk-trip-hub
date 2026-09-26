import { Link, useLocation } from "@tanstack/react-router";
import { Heart, Home, Map, Search, User } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function MobileTabBar() {
  const { t } = useI18n();
  const location = useLocation();
  const items = [
    { to: "/" as const, icon: Home, label: t("nav.home") },
    { to: "/search" as const, icon: Search, label: t("nav.search") },
    { to: "/tours" as const, icon: Map, label: t("nav.tours") },
    { to: "/favorites" as const, icon: Heart, label: t("nav.favorites") },
    { to: "/account" as const, icon: User, label: t("nav.account") },
  ];
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
      <ul className="grid grid-cols-5 gap-0.5 px-1.5 py-1.5">
        {items.map((item) => {
          const isActive =
            item.to === "/" ? location.pathname === "/" : location.pathname.startsWith(item.to);
          return (
            <li key={item.to}>
              <Link
                to={item.to}
                className="flex flex-col items-center"
                aria-current={isActive ? "page" : undefined}
              >
                <span
                  className={`flex w-full flex-col items-center gap-0.5 rounded-2xl py-1.5 transition-colors duration-200 ${
                    isActive ? "bg-brand-soft text-brand" : "text-muted-foreground"
                  }`}
                >
                  <item.icon className="size-5" strokeWidth={isActive ? 2.2 : 1.8} />
                  <span className={`text-[10px] leading-none ${isActive ? "font-semibold" : ""}`}>
                    {item.label}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
