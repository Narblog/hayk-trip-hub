import { Link } from "@tanstack/react-router";
import { Instagram, Facebook, Send } from "lucide-react";
import { Logo } from "./Logo";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useI18n } from "@/lib/i18n";

export function Footer() {
  const { t } = useI18n();

  const columns = [
    {
      title: t("footer.explore"),
      links: [
        { to: "/search" as const, label: t("nav.stays") },
        { to: "/destinations" as const, label: t("nav.destinations") },
        { to: "/tours" as const, label: t("nav.tours") },
        { to: "/favorites" as const, label: t("nav.favorites") },
      ],
    },
    {
      title: t("footer.hosts"),
      links: [
        { to: "/owner/properties/new" as const, label: t("nav.listProperty") },
        { to: "/owner" as const, label: t("nav.ownerDashboard") },
      ],
    },
    {
      title: t("footer.company"),
      links: [
        { to: "/about" as const, label: t("nav.about") },
        { to: "/help" as const, label: t("nav.help") },
        { to: "/terms" as const, label: t("nav.terms") },
        { to: "/privacy" as const, label: t("nav.privacy") },
      ],
    },
  ];

  return (
    <footer className="mt-24 border-t border-border/70 bg-surface">
      <div className="container-page grid gap-10 py-16 md:grid-cols-4">
        <div className="space-y-4">
          <Logo />
          <p className="max-w-xs text-sm text-muted-foreground">{t("footer.desc")}</p>
          <div className="flex items-center gap-2">
            {[Instagram, Facebook, Send].map((Icon, i) => (
              <span
                key={i}
                className="flex size-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground"
                aria-hidden="true"
              >
                <Icon className="size-4" />
              </span>
            ))}
          </div>
          <LanguageSwitcher />
        </div>

        {columns.map((col) => (
          <div key={col.title}>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {col.title}
            </h3>
            <ul className="space-y-2 text-sm">
              {col.links.map((l) => (
                <li key={l.to + l.label}>
                  <Link to={l.to} className="hover:text-brand">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border/70">
        <div className="container-page flex flex-wrap items-center justify-between gap-2 py-5 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} StayLand.am — {t("footer.rights")}</span>
          <span className="eyebrow">{t("footer.madeIn")}</span>
        </div>
      </div>
    </footer>
  );
}
