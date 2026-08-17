import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, MapPin, Search, Users } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { maxGuestsQuery, refDataQuery } from "@/lib/data";
import { addDaysISO, todayISO } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

export type SearchBarValues = {
  destination: string;
  checkIn: string;
  checkOut: string;
  guests: number;
};

export function SearchBar({
  initial,
  variant = "hero",
}: {
  initial?: Partial<SearchBarValues>;
  variant?: "hero" | "compact";
}) {
  const { t, localized } = useI18n();
  const navigate = useNavigate();
  const { data: ref } = useQuery(refDataQuery());
  const { data: maxGuests } = useQuery(maxGuestsQuery());
  const guestCap = Math.max(1, maxGuests ?? 20);
  const today = todayISO();
  const initialCheckIn = initial?.checkIn && initial.checkIn >= today ? initial.checkIn : "";
  const initialCheckOut = initial?.checkOut && initial.checkOut > (initialCheckIn || today) ? initial.checkOut : "";
  const [values, setValues] = useState<SearchBarValues>({
    destination: initial?.destination ?? "",
    checkIn: initialCheckIn,
    checkOut: initialCheckOut,
    guests: initial?.guests ?? 2,
  });
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);

  type Suggestion = { key: string; label: string; sub: string };
  const allPlaces = useMemo<Suggestion[]>(() => {
    const cities = (ref?.cities ?? []).map((c) => ({
      key: `c:${c.code}`,
      label: localized(c, "name"),
      sub: [c.name_en, c.name_hy, c.name_ru, c.code].join(" "),
    }));
    const regions = (ref?.regions ?? []).map((r) => ({
      key: `r:${r.code}`,
      label: localized(r, "name"),
      sub: [r.name_en, r.name_hy, r.name_ru, r.code].join(" "),
    }));
    return [...cities, ...regions];
  }, [ref, localized]);

  const suggestions = useMemo(() => {
    const q = values.destination.trim().toLowerCase();
    if (!q) return allPlaces.slice(0, 8);
    return allPlaces.filter((p) => p.sub.toLowerCase().includes(q) || p.label.toLowerCase().includes(q)).slice(0, 8);
  }, [allPlaces, values.destination]);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  function pick(s: Suggestion) {
    setValues((v) => ({ ...v, destination: s.label }));
    setOpen(false);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setOpen(false);
    let { checkIn, checkOut } = values;
    if (checkIn && checkIn < today) checkIn = today;
    if (checkIn && checkOut && checkOut <= checkIn) checkOut = addDaysISO(checkIn, 1);
    if (checkOut && !checkIn) {
      setError(t("search.checkIn"));
      return;
    }
    setError(null);
    navigate({
      to: "/search",
      search: {
        destination: values.destination.trim() || undefined,
        checkIn: checkIn || undefined,
        checkOut: checkOut || undefined,
        guests: Math.min(guestCap, Math.max(1, values.guests)),
        page: 1,
      },
    });
  }

  const fieldClass =
    "flex min-w-0 flex-1 items-center gap-2.5 rounded-2xl px-4 py-3 transition-colors hover:bg-surface md:rounded-none md:px-5 md:hover:bg-surface/60";

  return (
    <form
      onSubmit={submit}
      className={`w-full rounded-3xl border border-border/70 bg-card p-2 md:rounded-full md:p-2 ${
        variant === "hero" ? "shadow-search" : "shadow-card"
      }`}
    >
      <div className="flex flex-col gap-1 md:flex-row md:items-center md:divide-x md:divide-border">
        <div ref={boxRef} className={`relative ${fieldClass}`}>
          <MapPin className="size-4 shrink-0 text-brand" />
          <span className="sr-only">{t("search.where")}</span>
          <input
            value={values.destination}
            role="combobox"
            aria-expanded={open}
            aria-autocomplete="list"
            autoComplete="off"
            onFocus={() => setOpen(true)}
            onChange={(e) => {
              setValues((v) => ({ ...v, destination: e.target.value }));
              setHighlight(0);
              setOpen(true);
            }}
            onKeyDown={(e) => {
              if (!open) return;
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setHighlight((h) => Math.min(suggestions.length - 1, h + 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setHighlight((h) => Math.max(0, h - 1));
              } else if (e.key === "Enter" && suggestions[highlight]) {
                e.preventDefault();
                pick(suggestions[highlight]);
              } else if (e.key === "Escape") {
                setOpen(false);
              }
            }}
            placeholder={t("search.wherePlaceholder")}
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {open && suggestions.length > 0 ? (
            <ul className="absolute left-0 top-[calc(100%+0.5rem)] z-50 max-h-72 w-full min-w-[16rem] overflow-auto rounded-2xl border border-border bg-card p-1.5 shadow-card">
              {suggestions.map((s, i) => (
                <li key={s.key}>
                  <button
                    type="button"
                    onMouseEnter={() => setHighlight(i)}
                    onClick={() => pick(s)}
                    className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm ${
                      i === highlight ? "bg-surface" : ""
                    }`}
                  >
                    <MapPin className="size-3.5 shrink-0 text-brand" />
                    <span className="truncate">{s.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <label className={fieldClass}>
          <CalendarDays className="size-4 shrink-0 text-brand" />
          <span className="sr-only">{t("search.checkIn")}</span>
          <input
            type="date"
            min={today}
            value={values.checkIn}
            onChange={(e) => {
              const checkIn = e.target.value >= today ? e.target.value : "";
              setValues((v) => ({
                ...v,
                checkIn,
                checkOut: v.checkOut && checkIn && v.checkOut > checkIn ? v.checkOut : "",
              }));
            }}
            className="w-full bg-transparent text-sm outline-none"
            aria-label={t("search.checkIn")}
          />
        </label>

        <label className={fieldClass}>
          <CalendarDays className="size-4 shrink-0 text-brand" />
          <span className="sr-only">{t("search.checkOut")}</span>
          <input
            type="date"
            min={values.checkIn ? addDaysISO(values.checkIn, 1) : addDaysISO(today, 1)}
            value={values.checkOut}
            onChange={(e) => {
              const minimum = values.checkIn ? addDaysISO(values.checkIn, 1) : addDaysISO(today, 1);
              setValues((v) => ({ ...v, checkOut: e.target.value >= minimum ? e.target.value : "" }));
            }}
            className="w-full bg-transparent text-sm outline-none"
            aria-label={t("search.checkOut")}
          />
        </label>

        <label className={`${fieldClass} md:max-w-[9.5rem]`}>
          <Users className="size-4 shrink-0 text-brand" />
          <span className="sr-only">{t("search.guests")}</span>
          <input
            type="number"
            min={1}
            max={guestCap}
            value={values.guests}
            onChange={(e) =>
              setValues((v) => ({ ...v, guests: Math.min(guestCap, Math.max(1, Number(e.target.value) || 1)) }))
            }
            className="w-full bg-transparent text-sm outline-none"
            aria-label={t("search.guests")}
            title={`max ${guestCap}`}
          />
          <span className="hidden text-xs text-muted-foreground sm:inline">{t("search.guests")}</span>
        </label>

        <div className="p-1 md:pl-2">
          <Button type="submit" size="lg" className="w-full rounded-xl md:w-auto md:rounded-full">
            <Search className="size-4" />
            <span className="md:sr-only lg:not-sr-only">{t("search.submit")}</span>
          </Button>
        </div>
      </div>
      {error ? <p className="px-4 pb-2 text-xs text-destructive">{error}</p> : null}
    </form>
  );
}