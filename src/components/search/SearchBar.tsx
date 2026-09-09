import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, MapPin, Minus, Plus, Search, Users } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { maxGuestsQuery, refDataQuery } from "@/lib/data";
import { addDaysISO, todayISO } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

function DateField({
  icon,
  label,
  placeholder,
  value,
  min,
  onChange,
  fieldClass,
}: {
  icon: React.ReactNode;
  label: string;
  placeholder: string;
  value: string;
  min: string;
  onChange: (value: string) => void;
  fieldClass: string;
}) {
  return (
    <div className={fieldClass}>
      {icon}
      <DatePicker
        value={value}
        min={min}
        onChange={onChange}
        placeholder={placeholder}
        label={label}
        buttonClassName="h-auto flex-1 border-0 bg-transparent px-0 text-base shadow-none focus-visible:ring-0 md:text-sm"
      />
    </div>
  );
}

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

  type Suggestion = { key: string; label: string; sub: string; popular: boolean };
  const allPlaces = useMemo<Suggestion[]>(() => {
    const cities = (ref?.cities ?? []).map((c) => ({
      key: `c:${c.code}`,
      label: localized(c, "name"),
      sub: [c.name_en, c.name_hy, c.name_ru, c.code].join(" "),
      popular: Boolean((c as { is_popular?: boolean }).is_popular),
    }));
    const regions = (ref?.regions ?? []).map((r) => ({
      key: `r:${r.code}`,
      label: localized(r, "name"),
      sub: [r.name_en, r.name_hy, r.name_ru, r.code].join(" "),
      popular: false,
    }));
    return [...cities, ...regions];
  }, [ref, localized]);

  const suggestions = useMemo(() => {
    const q = values.destination.trim().toLowerCase();
    if (!q) {
      const popular = allPlaces.filter((p) => p.popular);
      return (popular.length ? popular : allPlaces).slice(0, 6);
    }
    const matches = allPlaces.filter(
      (p) => p.sub.toLowerCase().includes(q) || p.label.toLowerCase().includes(q),
    );
    const rank = (p: Suggestion) => {
      const starts = p.label.toLowerCase().startsWith(q) || p.sub.toLowerCase().split(" ").some((w) => w.startsWith(q));
      return (p.popular ? 0 : 2) + (starts ? 0 : 1);
    };
    return [...matches].sort((a, b) => rank(a) - rank(b) || a.label.localeCompare(b.label)).slice(0, 8);
  }, [allPlaces, values.destination]);

  const listHeading = values.destination.trim() ? t("search.matches") : t("search.popular");

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
      className={`w-full p-2 md:p-2 ${
        variant === "hero"
          ? ""
          : "rounded-3xl border border-border/70 bg-card shadow-card md:rounded-full"
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
            className="w-full bg-transparent text-base outline-none placeholder:text-muted-foreground md:text-sm"
          />
          {open && suggestions.length > 0 ? (
            <div className="absolute left-0 top-[calc(100%+0.5rem)] z-[60] w-full max-w-full overflow-hidden rounded-2xl border border-border bg-card shadow-lift md:min-w-[18rem] md:max-w-[min(24rem,90vw)]">
              <p className="eyebrow px-4 pb-1 pt-3 text-muted-foreground">{listHeading}</p>
              <ul className="scrollbar-none max-h-72 overflow-auto p-1.5">
              {suggestions.map((s, i) => (
                <li key={s.key}>
                  <button
                    type="button"
                    onMouseEnter={() => setHighlight(i)}
                    onClick={() => pick(s)}
                    className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                      i === highlight ? "bg-surface" : ""
                    }`}
                  >
                    <MapPin className="size-3.5 shrink-0 text-brand" />
                    <span className="truncate">{s.label}</span>
                    {s.popular && !values.destination.trim() ? (
                      <span className="ml-auto rounded-full bg-brand-soft px-2 py-0.5 text-[0.625rem] text-accent-foreground">
                        ★
                      </span>
                    ) : null}
                  </button>
                </li>
              ))}
              </ul>
            </div>
          ) : null}
        </div>

        <DateField
          icon={<CalendarDays className="size-4 shrink-0 text-brand" />}
          label={t("search.checkIn")}
          placeholder={t("search.checkInPlaceholder")}
          value={values.checkIn}
          min={today}
          onChange={(checkIn) =>
            setValues((v) => ({
              ...v,
              checkIn: checkIn >= today ? checkIn : "",
              checkOut: v.checkOut && checkIn && v.checkOut > checkIn ? v.checkOut : "",
            }))
          }
          fieldClass={fieldClass}
        />

        <DateField
          icon={<CalendarDays className="size-4 shrink-0 text-brand" />}
          label={t("search.checkOut")}
          placeholder={t("search.checkOutPlaceholder")}
          value={values.checkOut}
          min={values.checkIn ? addDaysISO(values.checkIn, 1) : addDaysISO(today, 1)}
          onChange={(checkOut) => {
            const minimum = values.checkIn ? addDaysISO(values.checkIn, 1) : addDaysISO(today, 1);
            setValues((v) => ({ ...v, checkOut: checkOut >= minimum ? checkOut : "" }));
          }}
          fieldClass={fieldClass}
        />

        <div className={`${fieldClass} md:max-w-[12rem]`}>
          <Users className="size-4 shrink-0 text-brand" />
          <span className="min-w-0 flex-1 truncate text-base md:text-sm">
            {values.guests} <span className="text-muted-foreground">{t("search.guests")}</span>
          </span>
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              aria-label="-"
              disabled={values.guests <= 1}
              onClick={() => setValues((v) => ({ ...v, guests: Math.max(1, v.guests - 1) }))}
              className="flex size-8 items-center justify-center rounded-full border border-border text-base leading-none transition-colors hover:bg-surface disabled:opacity-40"
            >
              <Minus className="size-4" />
            </button>
            <button
              type="button"
              aria-label="+"
              disabled={values.guests >= guestCap}
              onClick={() => setValues((v) => ({ ...v, guests: Math.min(guestCap, v.guests + 1) }))}
              className="flex size-8 items-center justify-center rounded-full border border-border text-base leading-none transition-colors hover:bg-surface disabled:opacity-40"
            >
              <Plus className="size-4" />
            </button>
          </div>
        </div>

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