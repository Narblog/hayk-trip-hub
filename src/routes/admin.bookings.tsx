import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CalendarDays, Phone, Snowflake, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BookingStatusPill } from "@/components/booking/BookingStatusPill";
import { EmptyState, ErrorState, InlineLoader } from "@/components/common/states";
import { useAuth } from "@/lib/auth";
import { adminBookingsQuery, type BookingStatus } from "@/lib/data";
import { formatDate, formatPrice } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/admin/bookings")({
  head: () => ({ meta: [
    { title: "Ամրագրումներ — StayLand ադմին" },
    { name: "description", content: "Կացարանների և ամանորյա փաթեթների ամրագրումների վերահսկում։" },
    { property: "og:title", content: "Ամրագրումներ — StayLand ադմին" },
    { property: "og:description", content: "Կացարանների և ամանորյա փաթեթների հայտերը մեկ տեղում։" },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: AdminBookingsPage,
});

function AdminBookingsPage() {
  const { isAdmin, loading } = useAuth();
  const { t, lang } = useI18n();
  const q = useQuery({ ...adminBookingsQuery(), enabled: isAdmin });
  const [status, setStatus] = useState<BookingStatus | "ALL">("ALL");
  const [packagesOnly, setPackagesOnly] = useState(false);
  if (loading) return <InlineLoader />;
  if (!isAdmin) return <div className="container-page py-16 text-center text-muted-foreground">{t("error.title")}</div>;
  const rows = (q.data ?? []).filter((b) => (status === "ALL" || b.status === status) && (!packagesOnly || !!b.package_id));
  return (
    <div className="container-page min-w-0 py-8 sm:py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold sm:text-3xl">{t("admin.bookingsManage")}</h1>
        <Button asChild variant="outline" size="sm"><Link to="/admin"><ArrowLeft className="size-4" />{t("nav.admin")}</Link></Button>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        {(["ALL", "PENDING", "ACCEPTED", "DECLINED", "CANCELLED", "COMPLETED"] as const).map((f) => (
          <Button key={f} size="sm" variant={status === f ? "default" : "outline"} onClick={() => setStatus(f)}>{f === "ALL" ? t("book.filterAll") : t(`bstatus.${f}`)}</Button>
        ))}
        <Button size="sm" variant={packagesOnly ? "secondary" : "outline"} aria-pressed={packagesOnly} onClick={() => setPackagesOnly(!packagesOnly)}><Snowflake className="size-4" />{t("book.packageBadge")}</Button>
      </div>
      <div className="mt-5 space-y-4">
        {q.isPending ? <InlineLoader /> : q.isError ? <ErrorState message={t("error.friendly")} onRetry={() => q.refetch()} /> : !rows.length ? <EmptyState title={t("book.ownerEmpty")} /> : rows.map((b) => (
          <article key={b.id} className="min-w-0 rounded-lg border border-border bg-card p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h2 className="break-words font-display text-lg font-semibold">{b.properties?.name}</h2>
                {b.package_id ? <p className="mt-1 flex items-start gap-2 text-sm font-semibold text-brand"><Snowflake className="mt-0.5 size-4 shrink-0" /><span className="min-w-0 break-words">{t("book.packageBadge")}{b.packages?.title ? ` · ${b.packages.title}` : ""}</span></p> : null}
                <p className="mt-1 text-xs text-muted-foreground">{t("book.reference")} {b.reference}</p>
              </div>
              <BookingStatusPill status={b.status} />
            </div>
            <div className="mt-4 grid gap-4 text-sm sm:grid-cols-3">
              <div className="min-w-0 space-y-1"><p className="break-words font-medium">{b.guest_name}</p><a href={`tel:${b.guest_phone}`} className="flex items-center gap-2 text-brand"><Phone className="size-4 shrink-0" />{b.guest_phone}</a>{b.guest_email ? <p className="break-all text-muted-foreground">{b.guest_email}</p> : null}</div>
              <div className="space-y-2"><p className="flex items-start gap-2"><CalendarDays className="mt-0.5 size-4 shrink-0 text-muted-foreground" /><span>{formatDate(b.check_in, lang)} – {formatDate(b.check_out, lang)}</span></p><p className="flex items-center gap-2 text-muted-foreground"><Users className="size-4" />{b.adults + b.children} {t("book.guests")} · {b.nights} {t("book.nights")}</p></div>
              <div><p className="text-xs text-muted-foreground">{t("book.total")}</p><p className="break-words font-display text-xl font-semibold">{formatPrice(Number(b.confirmed_total_price ?? b.total_price), b.currency, lang)}</p></div>
            </div>
            {b.message ? <p className="mt-4 whitespace-pre-line break-words border-t border-border pt-3 text-sm text-muted-foreground">{b.message}</p> : null}
          </article>
        ))}
      </div>
    </div>
  );
}