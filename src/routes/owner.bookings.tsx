import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarClock, CalendarDays, Check, CheckCircle2, Mail, MapPin, Phone, User, Users, Wallet, X } from "lucide-react";
import { OwnerShell } from "@/components/owner/OwnerShell";
import { StatCard, monthRevenue } from "@/routes/owner.index";
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

const FILTERS: (BookingStatus | "ALL")[] = ["ALL", "PENDING", "ACCEPTED", "DECLINED", "CANCELLED"];

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

  const all = bookings.data ?? [];
  const rows: BookingRow[] = all.filter((b) => filter === "ALL" || b.status === filter);
  const pending = all.filter((b) => b.status === "PENDING").length;
  const accepted = all.filter((b) => b.status === "ACCEPTED").length;
  const revenue = monthRevenue(all);

  return (
    <OwnerShell>
      <h1 className="font-display text-3xl font-semibold">{t("book.ownerTitle")}</h1>
      <p className="mt-1 text-muted-foreground">{t("book.ownerSub")}</p>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <StatCard icon={<CalendarClock className="size-4" />} tone="gold" label={t("owner.pending")} value={String(pending)} />
        <StatCard icon={<CheckCircle2 className="size-4" />} tone="brand" label={t("owner.approved")} value={String(accepted)} />
        <StatCard icon={<Wallet className="size-4" />} tone="brand" label={t("owner.monthRevenue")} value={formatPrice(revenue, "AMD", lang)} />
      </div>

      <div className="mt-5 flex flex-wrap gap-1.5 rounded-2xl border border-border bg-card p-1.5">
        {FILTERS.map((f) => (
          <Button
            key={f}
            size="sm"
            variant={filter === f ? "default" : "ghost"}
            className="rounded-full"
            onClick={() => setFilter(f)}
          >
            {f === "ALL" ? t("book.filterAll") : t(`bstatus.${f}`)}
          </Button>
        ))}
      </div>

      <div className="mt-5 space-y-4">
        {bookings.isPending ? (
          <InlineLoader />
        ) : rows.length === 0 ? (
          <EmptyState title={t("book.ownerEmpty")} />
        ) : (
          rows.map((b) => (
            <article key={b.id} className="rounded-2xl border border-border bg-card p-4 sm:p-5">
              <div className="grid gap-4 sm:grid-cols-[10rem_minmax(0,1fr)]">
                <div className="h-32 overflow-hidden rounded-xl bg-surface sm:h-full">
                  {b.properties?.main_image_url ? (
                    <img src={b.properties.main_image_url} alt="" className="size-full object-cover" />
                  ) : null}
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-display text-lg font-semibold">{b.properties?.name}</p>
                      {b.properties?.city_code ? (
                        <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                          <MapPin className="size-3.5 shrink-0" /> {b.properties.city_code}
                        </p>
                      ) : null}
                    </div>
                    <BookingStatusPill status={b.status} />
                  </div>

                  <div className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
                    <div className="space-y-1.5">
                      <p className="text-xs text-muted-foreground">{t("book.guestContact")}</p>
                      <p className="flex items-center gap-2"><User className="size-3.5 shrink-0 text-muted-foreground" />{b.guest_name}</p>
                      <a href={`tel:${b.guest_phone}`} className="flex items-center gap-2 font-medium text-brand">
                        <Phone className="size-3.5 shrink-0" /> {b.guest_phone}
                      </a>
                      {b.guest_email ? (
                        <p className="flex min-w-0 items-center gap-2 text-muted-foreground">
                          <Mail className="size-3.5 shrink-0" /> <span className="truncate">{b.guest_email}</span>
                        </p>
                      ) : null}
                    </div>

                    <div className="space-y-1.5 sm:border-l sm:border-border sm:pl-3">
                      <p className="text-xs text-muted-foreground">{t("book.reference")} {b.reference}</p>
                      <p className="flex items-center gap-2">
                        <CalendarDays className="size-3.5 shrink-0 text-muted-foreground" />
                        {formatDate(b.check_in, lang)} – {formatDate(b.check_out, lang)}
                      </p>
                      <p className="flex items-center gap-2 text-muted-foreground">
                        <CalendarClock className="size-3.5 shrink-0" /> {b.nights} {t("book.nights")}
                      </p>
                      <p className="flex items-center gap-2 text-muted-foreground">
                        <Users className="size-3.5 shrink-0" /> {b.adults + b.children} {t("book.guests")}
                      </p>
                    </div>

                    <div className="space-y-1 sm:border-l sm:border-border sm:pl-3">
                      <p className="text-xs text-muted-foreground">
                        {formatPrice(Number(b.nightly_price), b.currency, lang)} × {b.nights}
                      </p>
                      <div className="mt-2 border-t border-border pt-2">
                        <p className="text-xs text-muted-foreground">{t("book.total")}</p>
                        <p className="font-display text-xl font-semibold">
                          {formatPrice(Number(b.confirmed_total_price ?? b.total_price), b.currency, lang)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {b.message ? (
                    <div className="mt-3">
                      <p className="text-xs text-muted-foreground">{t("book.message")}</p>
                      <p className="mt-1 whitespace-pre-line rounded-xl bg-surface p-3 text-sm">{b.message}</p>
                    </div>
                  ) : null}

                  {b.status === "PENDING" ? (
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      <Button
                        variant="outline"
                        disabled={respond.isPending}
                        onClick={() => respond.mutate({ bookingId: b.id, action: "DECLINE" })}
                      >
                        <X className="size-4" /> {t("book.decline")}
                      </Button>
                      <Button
                        disabled={respond.isPending}
                        onClick={() =>
                          openId === b.id ? respond.mutate({ bookingId: b.id, action: "ACCEPT" }) : setOpenId(b.id)
                        }
                      >
                        <Check className="size-4" /> {t("book.accept")}
                      </Button>
                    </div>
                  ) : null}

                  {openId === b.id ? (
                    <div className="mt-3 grid gap-2 border-t border-border pt-3">
                      <Input
                        type="number"
                        min={0}
                        placeholder={t("book.confirmTotal")}
                        value={total}
                        onChange={(e) => setTotal(e.target.value)}
                      />
                      <Textarea rows={2} placeholder={t("book.priceNote")} value={note} onChange={(e) => setNote(e.target.value.slice(0, 300))} />
                      <Textarea rows={2} placeholder={t("book.declineReason")} value={reason} onChange={(e) => setReason(e.target.value.slice(0, 300))} />
                    </div>
                  ) : null}
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </OwnerShell>
  );
}
