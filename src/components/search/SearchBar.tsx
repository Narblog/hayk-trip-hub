import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, MapPin, Search, Users } from "lucide-react";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { refDataQuery } from "@/lib/data";
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
  const listId = useId();
  const { data: ref } = useQuery(refDataQuery());
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

  function submit(e: React.FormEvent) {
    e.preventDefault();
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
        guests: Math.max(1, values.guests),
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
        <label className={fieldClass}>
          <MapPin className="size-4 shrink-0 text-brand" />
          <span className="sr-only">{t("search.where")}</span>
          <input
            list={listId}
            value={values.destination}
            onChange={(e) => setValues((v) => ({ ...v, destination: e.target.value }))}
            placeholder={t("search.wherePlaceholder")}
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <datalist id={listId}>
            {(ref?.cities ?? []).map((c) => (
              <option key={c.code} value={localized(c, "name")} />
            ))}
            {(ref?.regions ?? []).map((r) => (
              <option key={r.code} value={localized(r, "name")} />
            ))}
          </datalist>
        </label>

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
            max={40}
            value={values.guests}
            onChange={(e) => setValues((v) => ({ ...v, guests: Number(e.target.value) || 1 }))}
            className="w-full bg-transparent text-sm outline-none"
            aria-label={t("search.guests")}
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