import { Link, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bell, CalendarCheck, Heart, LayoutDashboard, LogOut, Menu, Shield, User as UserIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/lib/auth";
import { notificationsQuery, profileQuery } from "@/lib/data";
import { initials } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

export function Header() {
  const { t } = useI18n();
  const { user, isOwner, isAdmin, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const transparent = pathname === "/" && !scrolled;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const { data: profile } = useQuery(profileQuery(user?.id ?? null));
  const { data: notifications = [] } = useQuery(notificationsQuery(user?.id ?? null));
  const unread = notifications.filter((n) => !n.is_read).length;

  const navItems = [
    { to: "/search" as const, label: t("nav.stays") },
    { to: "/tours" as const, label: t("nav.toursExperiences") },
    { to: "/destinations" as const, label: t("nav.destinations") },
  ];

  return (
    <header
      className={`sticky top-0 z-50 w-full border-b transition-all duration-300 ${
        transparent
          ? "border-transparent bg-background/40"
          : "border-border/70 bg-background/90 shadow-card"
      } backdrop-blur-xl`}
    >
      <div className="container-page flex h-20 items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <Logo />
          <nav className="hidden items-center gap-2 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
                activeProps={{ className: "text-foreground bg-surface" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="hidden rounded-full lg:inline-flex">
            <Link to="/owner/properties/new">{t("nav.listProperty")}</Link>
          </Button>
          <LanguageSwitcher compact />

          {user ? (
            <>
              <Button asChild variant="ghost" size="icon" className="relative hidden sm:inline-flex">
                <Link to="/account/notifications" aria-label={t("notif.title")}>
                  <Bell className="size-4" />
                  {unread > 0 ? (
                    <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-brand" />
                  ) : null}
                </Link>
              </Button>
              {isOwner ? (
                <Button asChild size="sm" className="hidden rounded-full sm:inline-flex">
                  <Link to="/owner">
                    <LayoutDashboard className="size-4" /> {t("nav.myPage")}
                  </Link>
                </Button>
              ) : null}
              {isAdmin ? (
                <>
                  <Button asChild size="sm" className="hidden rounded-full sm:inline-flex">
                    <Link to="/admin">
                      <Shield className="size-4" /> {t("nav.adminDashboard")}
                    </Link>
                  </Button>
                  <Link
                    to="/admin"
                    aria-label={t("nav.adminDashboard")}
                    className="ml-1 rounded-full ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Avatar className="size-9 border border-border">
                      <AvatarFallback className="bg-brand-soft text-xs font-semibold text-brand">
                        {initials(profile?.full_name ?? user.email)}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={t("nav.logout")}
                    onClick={() => void signOut()}
                  >
                    <LogOut className="size-4" />
                  </Button>
                </>
              ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="ml-1 rounded-full ring-offset-background focus-visible:ring-2 focus-visible:ring-ring">
                    <Avatar className="size-9 border border-border">
                      <AvatarFallback className="bg-brand-soft text-xs font-semibold text-brand">
                        {initials(profile?.full_name ?? user.email)}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="truncate">{profile?.full_name || user.email}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/account">
                      <UserIcon className="size-4" /> {t("nav.account")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/account/bookings">
                      <CalendarCheck className="size-4" /> {t("book.myTitle")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/favorites">
                      <Heart className="size-4" /> {t("nav.favorites")}
                    </Link>
                  </DropdownMenuItem>

                  {isOwner ? (
                    <DropdownMenuItem asChild>
                      <Link to="/owner">
                        <LayoutDashboard className="size-4" /> {t("nav.ownerDashboard")}
                      </Link>
                    </DropdownMenuItem>
                  ) : null}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => void signOut()}>
                    <LogOut className="size-4" /> {t("nav.logout")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              )}

            </>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Button asChild variant="ghost" size="sm" className="rounded-full">
                <Link to="/auth">{t("nav.login")}</Link>
              </Button>
              <Button asChild size="sm" className="rounded-full">
                <Link to="/auth" search={{ mode: "register" }}>
                  {t("nav.register")}
                </Link>
              </Button>
            </div>
          )}

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label={t("nav.menu")}>
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[86vw] max-w-sm">
              <SheetTitle className="sr-only">{t("nav.menu")}</SheetTitle>
              <div className="flex flex-col gap-1 p-6 pt-12">
                {navItems.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-3 py-3 font-display text-lg hover:bg-surface"
                  >
                    {item.label}
                  </Link>
                ))}
                <Link
                  to="/owner/properties/new"
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-3 font-display text-lg hover:bg-surface"
                >
                  {t("nav.listProperty")}
                </Link>
                <div className="mt-4 border-t border-border pt-4">
                  {user ? (
                    <Button variant="outline" className="w-full" onClick={() => void signOut()}>
                      {t("nav.logout")}
                    </Button>
                  ) : (
                    <div className="grid gap-2">
                      <Button asChild onClick={() => setOpen(false)}>
                        <Link to="/auth">{t("nav.login")}</Link>
                      </Button>
                      <Button asChild variant="outline" onClick={() => setOpen(false)}>
                        <Link to="/auth" search={{ mode: "register" }}>
                          {t("nav.register")}
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}