import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState, InlineLoader } from "@/components/common/states";
import { BookingStatusPill } from "@/components/booking/BookingStatusPill";
import { useAuth } from "@/lib/auth";
import { ownerBookingsQuery, respondBooking, type BookingRow, type BookingStatus } from "@/lib/data";
import { formatDate, formatPrice } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/owner/bookings")({
  head: () => ({
    meta: [
      { title: "Booking requests — StayLand Armenia" },
      { name: "description", content: "Review, accept or decline booking requests travellers send for your Armenian stays." },
      { property: "og:title", content: "Booking requests — StayLand" },
      { property: "og:description", content: "Manage traveller requests for your listings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OwnerBookingsPage,
});

const FILTERS: (BookingStatus | "ALL")[] = ["PENDING", "ACCEPTED", "DECLINED", "CANCELLED", "ALL"];

function OwnerBookingsPage() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<BookingStatus | "ALL">("PENDING");
  const [openId, setOpenId] = useState<string | null>(null);
  const [total, setTotal] = useState("");
  const [note, setNote] = useState("");
  const [reason, setReason] = useState("");

  const bookings = useQuery(ownerBookingsQuery(user?.id ?? null));

  const respond = useMutation({
    mutationFn: (input: { bookingId: string; action: "ACCEPT" | "DECLINE" }) =>
      respondBooking({
        bookingId: input.bookingId,
        action: input.action,
        confirmedTotal: input.action === "ACCEPT" && total ? Number(total) : null,
        ...(input.action === "ACCEPT" && note ? { note } : {}),
        ...(input.action === "DECLINE" && reason ? { reason } : {}),
      }),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["owner-bookings"] });
      qc.invalidateQueries({ queryKey: ["availability"] });
      toast.success(t(v.action === "ACCEPT" ? "book.accepted" : "book.declined"));
      setOpenId(null);
      setTotal("");
      setNote("");
      setReason("");
    },
    onError: (err) => {
      const raw = err instanceof Error ? err.message : "";
      toast.error(raw.includes("CONFLICT") ? t("book.conflict") : t("book.errGeneric"));
    },
  });

  if (!user)
    return (
      <div className="container-page py-16 text-center">
        <Button asChild><Link to="/auth">{t("nav.login")}</Link></Button>
      </div>
    );

  const rows: BookingRow[] = (bookings.data ?? []).filter((b) => filter === "ALL" || b.status === filter);

  return (
    <div className="container-page max-w-3xl py-10">
      <Link to="/owner" className="text-sm text-muted-foreground hover:text-foreground">← {t("cal.back")}</Link>
      <h1 className="mt-2 font-display text-3xl font-semibold">{t("book.ownerTitle")}</h1>
      <p className="mt-1 text-muted-foreground">{t("book.ownerSub")}</p>

      <div className="mt-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} className="rounded-full" onClick={() => setFilter(f)}>
            {f === "ALL" ? t("book.filterAll") : t(`bstatus.${f}`)}
          </Button>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {bookings.isPending ? (
          <InlineLoader />
        ) : rows.length === 0 ? (
          <EmptyState title={t("book.ownerEmpty")} />
        ) : (
          rows.map((b) => (
            <article key={b.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                <div className="min-w-0">
                  <p className="font-display text-lg font-semibold">{b.properties?.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(b.check_in, lang)} → {formatDate(b.check_out, lang)} · {b.nights} {t("book.nights")} ·{" "}
                    {b.adults + b.children} {t("book.guests")}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{t("book.reference")}: {b.reference}</p>
                </div>
                <BookingStatusPill status={b.status} />
              </div>

              <div className="mt-3 rounded-xl bg-surface p-3 text-sm">
                <p className="font-medium">{t("book.guestContact")}</p>
                <p className="text-muted-foreground">{b.guest_name}</p>
                <a href={`tel:${b.guest_phone}`} className="mt-1 inline-flex items-center gap-2 font-medium text-brand">
                  <Phone className="size-4" /> {b.guest_phone}
                </a>
                {b.guest_email ? <p className="text-muted-foreground">{b.guest_email}</p> : null}
                {b.message ? <p className="mt-2 whitespace-pre-line text-muted-foreground">{b.message}</p> : null}
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <p className="font-semibold">{formatPrice(Number(b.confirmed_total_price ?? b.total_price), b.currency, lang)}</p>
                {b.status === "PENDING" ? (
                  <Button variant={openId === b.id ? "secondary" : "outline"} size="sm" onClick={() => setOpenId(openId === b.id ? null : b.id)}>
                    {t("book.accept")} / {t("book.decline")}
                  </Button>
                ) : null}
              </div>

              {openId === b.id ? (
                <div className="mt-4 grid gap-3 border-t border-border pt-4">
                  <Input type="number" min={0} placeholder={t("book.confirmTotal")} value={total} onChange={(e) => setTotal(e.target.value)} />
                  <Textarea rows={2} placeholder={t("book.priceNote")} value={note} onChange={(e) => setNote(e.target.value.slice(0, 300))} />
                  <Textarea rows={2} placeholder={t("book.declineReason")} value={reason} onChange={(e) => setReason(e.target.value.slice(0, 300))} />
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Button disabled={respond.isPending} onClick={() => respond.mutate({ bookingId: b.id, action: "ACCEPT" })}>
                      {t("book.accept")}
                    </Button>
                    <Button variant="outline" disabled={respond.isPending} onClick={() => respond.mutate({ bookingId: b.id, action: "DECLINE" })}>
                      {t("book.decline")}
                    </Button>
                  </div>
                </div>
              ) : null}
            </article>
          ))
        )}
      </div>
    </div>
  );
}
