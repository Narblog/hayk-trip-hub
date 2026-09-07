import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EmptyState, InlineLoader } from "@/components/common/states";
import { BookingStatusPill } from "@/components/booking/BookingStatusPill";
import { useAuth } from "@/lib/auth";
import { bookingByToken, cancelBooking, localGuestBookings, myBookingsQuery, type BookingStatus } from "@/lib/data";
import { formatDate, formatPrice, todayISO } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/account/bookings")({
  head: () => ({
    meta: [
      { title: "My bookings — StayLand Armenia" },
      { name: "description", content: "Track the booking requests you sent to hosts across Armenia: pending, confirmed, past and cancelled." },
      { property: "og:title", content: "My bookings — StayLand" },
      { property: "og:description", content: "Your booking requests for stays in Armenia." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MyBookingsPage,
});

type Tab = "UPCOMING" | "PENDING" | "PAST" | "CANCELLED";

function MyBookingsPage() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("UPCOMING");
  const [busy, setBusy] = useState<string | null>(null);

  const mine = useQuery(myBookingsQuery(user?.id ?? null));
  const guestRefs = useMemo(() => (user ? [] : localGuestBookings()), [user]);
  const guestQueries = useQueries({
    queries: guestRefs.map((g) => ({
      queryKey: ["guest-booking", g.id],
      queryFn: () => bookingByToken(g.id, g.token),
    })),
  });

  const rows = user
    ? (mine.data ?? []).map((b) => ({
        id: b.id,
        reference: b.reference,
        name: b.properties?.name ?? "",
        slug: b.properties?.slug ?? "",
        check_in: b.check_in,
        check_out: b.check_out,
        nights: b.nights,
        total: Number(b.confirmed_total_price ?? b.total_price),
        currency: b.currency,
        status: b.status as BookingStatus,
        note: b.price_change_note,
        reason: b.decline_reason,
        token: undefined as string | undefined,
      }))
    : guestQueries
        .map((q, i) => {
          const b = q.data as Record<string, unknown> | null | undefined;
          if (!b) return null;
          return {
            id: String(b.id),
            reference: String(b.reference),
            name: String(b.property_name ?? ""),
            slug: String(b.property_slug ?? ""),
            check_in: String(b.check_in),
            check_out: String(b.check_out),
            nights: Number(b.nights),
            total: Number(b.confirmed_total_price ?? b.total_price),
            currency: String(b.currency),
            status: b.status as BookingStatus,
            note: (b.price_change_note as string | null) ?? null,
            reason: (b.decline_reason as string | null) ?? null,
            token: guestRefs[i]?.token,
          };
        })
        .filter(Boolean) as {
        id: string; reference: string; name: string; slug: string; check_in: string; check_out: string;
        nights: number; total: number; currency: string; status: BookingStatus; note: string | null;
        reason: string | null; token?: string;
      }[];

  const today = todayISO();
  const filtered = rows.filter((r) => {
    if (tab === "PENDING") return r.status === "PENDING";
    if (tab === "CANCELLED") return r.status === "CANCELLED" || r.status === "DECLINED";
    if (tab === "UPCOMING") return r.status === "ACCEPTED" && r.check_out >= today;
    return (r.status === "ACCEPTED" || r.status === "COMPLETED") && r.check_out < today;
  });

  const tabs: { key: Tab; label: string }[] = [
    { key: "UPCOMING", label: t("bstatus.ACCEPTED") },
    { key: "PENDING", label: t("bstatus.PENDING") },
    { key: "PAST", label: t("bstatus.COMPLETED") },
    { key: "CANCELLED", label: t("bstatus.CANCELLED") },
  ];

  async function doCancel(id: string, token?: string) {
    setBusy(id);
    try {
      await cancelBooking(id, token);
      toast.success(t("book.cancelled"));
      qc.invalidateQueries({ queryKey: ["my-bookings"] });
      qc.invalidateQueries({ queryKey: ["guest-booking", id] });
    } catch {
      toast.error(t("book.errGeneric"));
    } finally {
      setBusy(null);
    }
  }

  const loading = user ? mine.isPending : guestQueries.some((q) => q.isPending);

  return (
    <div className="container-page max-w-3xl py-10">
      <h1 className="font-display text-3xl font-semibold">{t("book.myTitle")}</h1>
      <p className="mt-1 text-muted-foreground">{t("book.mySub")}</p>

      <div className="mt-6 flex flex-wrap gap-2">
        {tabs.map((tb) => (
          <Button key={tb.key} size="sm" variant={tab === tb.key ? "default" : "outline"} className="rounded-full" onClick={() => setTab(tb.key)}>
            {tb.label}
          </Button>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {loading ? (
          <InlineLoader />
        ) : filtered.length === 0 ? (
          <EmptyState title={t("book.empty")} />
        ) : (
          filtered.map((r) => (
            <article key={r.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                <div className="min-w-0">
                  {r.slug ? (
                    <Link to="/property/$slug" params={{ slug: r.slug }} className="font-display text-lg font-semibold hover:underline">
                      {r.name}
                    </Link>
                  ) : (
                    <p className="font-display text-lg font-semibold">{r.name}</p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    {formatDate(r.check_in, lang)} → {formatDate(r.check_out, lang)} · {r.nights} {t("book.nights")}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{t("book.reference")}: {r.reference}</p>
                </div>
                <BookingStatusPill status={r.status} />
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <p className="font-semibold">{formatPrice(r.total, r.currency, lang)}</p>
                {r.status === "PENDING" || (r.status === "ACCEPTED" && r.check_in >= today) ? (
                  <Button variant="outline" size="sm" disabled={busy === r.id} onClick={() => void doCancel(r.id, r.token)}>
                    {t("book.cancel")}
                  </Button>
                ) : null}
              </div>
              {r.note ? <p className="mt-2 text-sm text-muted-foreground">{r.note}</p> : null}
              {r.reason ? <p className="mt-2 text-sm text-destructive">{r.reason}</p> : null}
            </article>
          ))
        )}
      </div>
    </div>
  );
}
