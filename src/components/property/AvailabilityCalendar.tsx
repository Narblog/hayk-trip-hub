import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { availabilityQuery } from "@/lib/data";
import { useI18n } from "@/lib/i18n";

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function AvailabilityCalendar({ propertyId }: { propertyId: string }) {
  const { t, lang } = useI18n();
  const today = new Date();
  const todayKey = iso(today);
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const { data } = useQuery(availabilityQuery(propertyId));

  const blocked = useMemo(() => {
    const set = new Set<string>();
    for (const row of data ?? []) if (row.status !== "AVAILABLE") set.add(row.date);
    return set;
  }, [data]);

  const locale = lang === "hy" ? "hy-AM" : lang === "ru" ? "ru-RU" : "en-GB";
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const lead = (first.getDay() + 6) % 7;
  const total = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  const cells: (Date | null)[] = Array.from({ length: lead }, () => null);
  for (let d = 1; d <= total; d++) cells.push(new Date(cursor.getFullYear(), cursor.getMonth(), d));
  const weekdays = Array.from({ length: 7 }, (_, i) =>
    new Date(2024, 0, 1 + i).toLocaleDateString(locale, { weekday: "short" }),
  );

  return (
    <div className="w-full rounded-2xl border border-border bg-card p-3 sm:p-4">
      <div className="flex items-center justify-between gap-2">
        <Button aria-label="Previous month" variant="ghost" size="icon" className="size-11 shrink-0 text-xl" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}>←</Button>
        <p className="min-w-0 text-center text-sm font-medium capitalize sm:text-base">{cursor.toLocaleDateString(locale, { month: "long", year: "numeric" })}</p>
        <Button aria-label="Next month" variant="ghost" size="icon" className="size-11 shrink-0 text-xl" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}>→</Button>
      </div>
      <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[11px] text-muted-foreground">
        {weekdays.map((w) => <div key={w}>{w}</div>)}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1 text-center text-sm">
        {cells.map((d, i) =>
          d ? (
            <div
              key={iso(d)}
              className={[
                "flex aspect-square min-w-0 items-center justify-center rounded-lg border text-xs sm:text-sm",
                iso(d) < todayKey
                  ? "border-transparent bg-muted/60 text-muted-foreground/50 line-through"
                  : blocked.has(iso(d))
                  ? "border-destructive/40 bg-destructive/10 text-destructive line-through"
                  : "border-border bg-background",
              ].join(" ")}
            >
              {d.getDate()}
            </div>
          ) : (
            <div key={`e${i}`} />
          ),
        )}
      </div>
      <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="size-3 rounded border border-border" />{t("cal.legendFree")}</span>
        <span className="flex items-center gap-1.5"><span className="size-3 rounded border border-destructive/40 bg-destructive/20" />{t("cal.legendBlocked")}</span>
      </div>
    </div>
  );
}
