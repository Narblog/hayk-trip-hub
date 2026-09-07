import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarCheck, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createBookingRequest, propertyBookingsQuery, quoteQuery, availabilityQuery } from "@/lib/data";
import { formatPrice, nightsBetween, nightsInRange, todayISO } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

const ERRORS: Record<string, string> = {
  DATES_TAKEN: "book.errUnavailable",
  RATE_LIMIT: "book.errRate",
  DUPLICATE_REQUEST: "book.errDuplicate",
  NO_PRICE: "book.errNoPrice",
  TOO_MANY_GUESTS: "book.errGuests",
  INVALID_DATES: "book.errPast",
  INVALID_CONTACT: "book.errName",
};

function Stepper({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2">
      <span className="text-sm">{label}</span>
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="icon" className="size-9 rounded-full" disabled={value <= min} onClick={() => onChange(value - 1)} aria-label={`${label} -`}>
          <Minus className="size-4" />
        </Button>
        <span className="w-6 text-center text-sm font-semibold">{value}</span>
        <Button type="button" variant="outline" size="icon" className="size-9 rounded-full" disabled={value >= max} onClick={() => onChange(value + 1)} aria-label={`${label} +`}>
          <Plus className="size-4" />
        </Button>
      </div>
    </div>
  );
}

type SentRange = { checkIn: string; checkOut: string };

function sentKey(propertyId: string) {
  return `stayland.requests.${propertyId}`;
}

function readSentRanges(propertyId: string): SentRange[] {
  try {
    const raw = window.localStorage.getItem(sentKey(propertyId));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((r) => r && typeof r.checkIn === "string" && typeof r.checkOut === "string") : [];
  } catch {
    return [];
  }
}

function overlaps(a: SentRange, b: SentRange) {
  return a.checkIn < b.checkOut && a.checkOut > b.checkIn;
}

export function BookingRequestCard({
  propertyId,
  maxGuests,
  fallbackPrice,
  currency,
}: {
  propertyId: string;
  maxGuests: number;
  fallbackPrice: number;
  currency: string;
}) {
  const { t, lang } = useI18n();
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [sentRanges, setSentRanges] = useState<SentRange[]>([]);

  useEffect(() => {
    const ranges = readSentRanges(propertyId);
    setSentRanges(ranges);
    if (ranges.length > 0) setDone(true);
  }, [propertyId]);

  const guests = adults + children;
  const { data: quote } = useQuery(quoteQuery(propertyId, guests));
  const { data: availability } = useQuery(availabilityQuery(propertyId));
  const { data: bookings } = useQuery(propertyBookingsQuery(propertyId));

  const nightly = quote?.has_price ? Number(quote.nightly_price) : fallbackPrice;
  const cur = quote?.currency ?? currency;
  const nights = nightsBetween(checkIn, checkOut);
  const total = nightly * nights;

  const takenNights = useMemo(() => {
    const set = new Set<string>();
    for (const row of availability ?? []) if (row.status !== "AVAILABLE") set.add(row.date);
    for (const b of bookings ?? []) {
      if (b.status !== "ACCEPTED") continue;
      for (const d of nightsInRange(b.check_in, b.check_out)) set.add(d);
    }
    return set;
  }, [availability, bookings]);

  const rangeConflict = useMemo(() => {
    if (!checkIn || !checkOut || nights <= 0) return false;
    return nightsInRange(checkIn, checkOut).some((d) => takenNights.has(d));
  }, [checkIn, checkOut, nights, takenNights]);

  const alreadySent = useMemo(() => {
    if (!checkIn || !checkOut || nights <= 0) return false;
    return sentRanges.some((r) => overlaps(r, { checkIn, checkOut }));
  }, [checkIn, checkOut, nights, sentRanges]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (nights <= 0) return setError(t("book.errDates"));
    if (rangeConflict) return setError(t("book.errUnavailable"));
    if (alreadySent) return setError(t("book.errDuplicate"));
    if (name.trim().length < 2) return setError(t("book.errName"));
    if (phone.trim().length < 5) return setError(t("book.errPhone"));
    setSending(true);
    try {
      await createBookingRequest({
        propertyId,
        checkIn,
        checkOut,
        adults,
        children,
        infants,
        name,
        phone,
        email,
        message,
      });
      const next = [...sentRanges, { checkIn, checkOut }];
      setSentRanges(next);
      try {
        window.localStorage.setItem(sentKey(propertyId), JSON.stringify(next));
      } catch {
        // storage full or blocked — booking is still created server-side
      }
      setDone(true);
    } catch (err) {
      const raw = err instanceof Error ? err.message : "";
      const key = Object.keys(ERRORS).find((k) => raw.includes(k));
      setError(t(key ? ERRORS[key]! : "book.errGeneric"));
    } finally {
      setSending(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-center shadow-card">
        <div className="mx-auto grid size-14 place-items-center rounded-full bg-brand-soft text-brand">
          <CalendarCheck className="size-7" />
        </div>
        <h3 className="mt-4 font-display text-xl font-semibold">{t("book.success")}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{t("book.successBody")}</p>
        <Button className="mt-5 h-12 w-full rounded-full" disabled>
          <CalendarCheck className="size-4" />
          {t("book.booked")}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <p className="font-display text-2xl font-semibold">
        {formatPrice(nightly, cur, lang)}
        <span className="ml-1 text-sm font-normal text-muted-foreground">/ {t("card.perNight")}</span>
      </p>
      <h3 className="mt-4 text-sm font-semibold">{t("book.title")}</h3>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div>
          <Label htmlFor="bk-in" className="text-xs text-muted-foreground">{t("book.checkIn")}</Label>
          <Input id="bk-in" type="date" min={todayISO()} value={checkIn} onChange={(e) => setCheckIn(e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label htmlFor="bk-out" className="text-xs text-muted-foreground">{t("book.checkOut")}</Label>
          <Input id="bk-out" type="date" min={checkIn || todayISO()} value={checkOut} onChange={(e) => setCheckOut(e.target.value)} className="mt-1" />
        </div>
      </div>

      <div className="mt-3 space-y-2">
        <Stepper label={t("book.adults")} value={adults} min={1} max={maxGuests} onChange={setAdults} />
        <Stepper label={t("book.children")} value={children} min={0} max={Math.max(0, maxGuests - adults)} onChange={setChildren} />
        <Stepper label={t("book.infants")} value={infants} min={0} max={5} onChange={setInfants} />
      </div>

      {nights > 0 ? (
        <div className="mt-3 rounded-xl bg-surface p-3 text-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span>{formatPrice(nightly, cur, lang)} × {nights} {t("book.nights")}</span>
          </div>
          <div className="mt-1 flex items-center justify-between font-semibold">
            <span>{t("book.total")}</span>
            <span>{formatPrice(total, cur, lang)}</span>
          </div>
        </div>
      ) : null}

      <div className="mt-3 grid gap-2">
        <Input placeholder={t("book.name")} value={name} onChange={(e) => setName(e.target.value)} maxLength={80} required />
        <Input placeholder={t("book.phone")} value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={30} required />
        <Input type="email" placeholder={t("book.email")} value={email} onChange={(e) => setEmail(e.target.value)} maxLength={120} />
        <Textarea placeholder={t("book.message")} value={message} onChange={(e) => setMessage(e.target.value.slice(0, 300))} rows={3} />
      </div>

      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
      {rangeConflict ? <p className="mt-3 text-sm text-destructive">{t("book.errUnavailable")}</p> : null}
      {!rangeConflict && alreadySent ? <p className="mt-3 text-sm text-destructive">{t("book.errDuplicate")}</p> : null}

      <Button type="submit" className="mt-4 h-12 w-full rounded-full" disabled={sending || rangeConflict || alreadySent}>
        {sending ? t("book.sending") : t("book.submit")}
      </Button>
      <p className="mt-3 text-xs text-muted-foreground">{t("book.disclaimer")}</p>
    </form>
  );
}
