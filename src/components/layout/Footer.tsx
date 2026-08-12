import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { useI18n } from "@/lib/i18n";

export function Footer() {
  const { t } = useI18n();
  return (
    <footer className="mt-24 border-t border-border bg-surface">
      <div className="container-page grid gap-10 py-14 md:grid-cols-4">
        <div className="space-y-3">
          <Logo />
          <p className="max-w-xs text-sm text-muted-foreground">{t("hero.subtitle")}</p>
        </div>
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {t("footer.explore")}
          </h3>
          <ul className="space-y-2 text-sm">
            <li><Link to="/search" className="hover:text-brand">{t("nav.stays")}</Link></li>
            <li><Link to="/tours" className="hover:text-brand">{t("nav.tours")}</Link></li>
            <li><Link to="/favorites" className="hover:text-brand">{t("nav.favorites")}</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {t("footer.hosts")}
          </h3>
          <ul className="space-y-2 text-sm">
            <li><Link to="/owner/properties/new" className="hover:text-brand">{t("nav.listProperty")}</Link></li>
            <li><Link to="/owner" className="hover:text-brand">{t("nav.ownerDashboard")}</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {t("footer.company")}
          </h3>
          <ul className="space-y-2 text-sm">
            <li><Link to="/about" className="hover:text-brand">{t("nav.about")}</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="container-page py-5 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Hyur — {t("footer.rights")}
        </div>
      </div>
    </footer>
  );
}