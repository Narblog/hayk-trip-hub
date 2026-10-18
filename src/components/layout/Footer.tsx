import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Instagram, Facebook, Send } from "lucide-react";
import { Logo } from "./Logo";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { footerPagesQuery, socialLinksQuery, type SocialLinks } from "@/lib/data";
import { useI18n } from "@/lib/i18n";

const emptySocial: SocialLinks = { instagram: "", facebook: "", telegram: "" };

export function Footer() {
  const { t, localized } = useI18n();
  const { data: cmsPages = [] } = useQuery(footerPagesQuery());
  const { data: social = emptySocial } = useQuery(socialLinksQuery());


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
        ...cmsPages.map((p) => ({
          to: "/p/$slug" as const,
          slug: p.slug,
          label: localized(p, "title"),
        })),
      ],
    },
  ];

  // Only icons with a saved page address are shown, so no icon ever looks
  // clickable when it isn't.
  const socialLinks = [
    { key: "instagram" as const, Icon: Instagram, url: social.instagram },
    { key: "facebook" as const, Icon: Facebook, url: social.facebook },
    { key: "telegram" as const, Icon: Send, url: social.telegram },
  ].filter((item) => item.url.trim().length > 0);


  return (
    <footer className="mt-10 border-t border-border/70 bg-surface md:mt-16">
      <div className="container-page py-6 md:py-10">
        <div className="grid grid-cols-3 gap-3 md:grid-cols-4 md:gap-8">
          <div className="col-span-3 flex flex-wrap items-center gap-x-4 gap-y-2 sm:col-span-1 sm:block sm:space-y-2">
            <Logo />
            <p className="max-w-xs text-xs text-muted-foreground md:text-sm">{t("footer.desc")}</p>
            {socialLinks.length > 0 ? (
              <div className="flex items-center gap-2">
                {socialLinks.map(({ key, Icon, url }) => (
                  <a
                    key={key}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t(`footer.${key}`)}
                    className="flex size-8 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:border-brand hover:text-brand md:size-9"
                  >
                    <Icon className="size-3.5 md:size-4" />
                  </a>
                ))}
              </div>
            ) : null}
            <LanguageSwitcher />
          </div>

          {columns.map((col) => (
            <div key={col.title} className="min-w-0">
              <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-normal text-muted-foreground md:mb-3 md:text-xs md:tracking-widest">
                {col.title}
              </h3>
              <ul className="space-y-1.5 text-xs leading-snug md:space-y-2 md:text-sm">
                {col.links.map((l) => (
                  <li key={l.to + l.label} className="min-w-0">
                    {"slug" in l ? (
                      <Link to="/p/$slug" params={{ slug: l.slug }} className="hover:text-brand">
                        {l.label}
                      </Link>
                    ) : (
                      <Link to={l.to} className="hover:text-brand">
                        {l.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-border/70 pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0">
        <div className="container-page flex flex-wrap items-center justify-between gap-2 py-3 text-[11px] text-muted-foreground md:py-4 md:text-xs">
          <span>© {new Date().getFullYear()} StayLand.am — {t("footer.rights")}</span>
          <span className="eyebrow">{t("footer.madeIn")}</span>
        </div>
      </div>
    </footer>
  );
}
