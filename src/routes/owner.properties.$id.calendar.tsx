import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { InlineLoader } from "@/components/common/states";
import { supabase } from "@/integrations/supabase/client";
import { availabilityQuery, propertyBookingsQuery } from "@/lib/data";
import { nightsInRange } from "@/lib/format";

import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/owner/properties/$id/calendar")({
  head: () => ({
    meta: [
      { title: "Availability calendar — StayLand Armenia" },
      { name: "description", content: "Block and free dates for your Armenian property so travellers always see real availability." },
      { property: "og:title", content: "Availability calendar — StayLand" },
      { property: "og:description", content: "Keep your Armenian listing's availability up to date." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CalendarPage,
});

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function monthDays(year: number, month: number) {
  const first = new Date(year, month, 1);
  const lead = (first.getDay() + 6) % 7; // Monday-first
  const total = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = Array.from({ length: lead }, () => null);
  for (let d = 1; d <= total; d++) cells.push(new Date(year, month, d));
  return cells;
}

function CalendarPage() {
  const { id } = Route.useParams();
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const qc = useQueryClient();
  const today = new Date();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [mode, setMode] = useState<"BLOCKED" | "AVAILABLE">("BLOCKED");

  const property = useQuery({
    queryKey: ["owner-property", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("id, name, slug, owner_id")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const availability = useQuery(availabilityQuery(id));
  const bookings = useQuery(propertyBookingsQuery(id));

  const blocked = useMemo(() => {
    const set = new Set<string>();
    for (const row of availability.data ?? []) if (row.status !== "AVAILABLE") set.add(row.date);
    return set;
  }, [availability.data]);

  const bookedSets = useMemo(() => {
    const pending = new Set<string>();
    const accepted = new Set<string>();
    for (const b of bookings.data ?? []) {
      const target = b.status === "ACCEPTED" ? accepted : pending;
      for (const d of nightsInRange(b.check_in, b.check_out)) target.add(d);
    }
    return { pending, accepted };
  }, [bookings.data]);



  const save = useMutation({
    mutationFn: async ({ dates, status }: { dates: string[]; status: "BLOCKED" | "AVAILABLE" }) => {
      if (dates.length === 0) return;
      if (status === "AVAILABLE") {
        const { error } = await supabase.from("availability").delete().eq("property_id", id).in("date", dates);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("availability")
          .upsert(dates.map((date) => ({ property_id: id, date, status: "BLOCKED" as const })), {
            onConflict: "property_id,date",
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["availability", id] });
      toast.success(t("cal.saved"));
    },
    onError: () => toast.error(t("cal.error")),
  });

  if (!user)
    return (
      <div className="container-page py-16 text-center">
        <Button asChild><Link to="/auth">{t("nav.login")}</Link></Button>
      </div>
    );

  if (property.isPending) return <div className="container-page py-16"><InlineLoader /></div>;
  if (!property.data) return <div className="container-page py-16 text-center text-muted-foreground">{t("cal.notFound")}</div>;

  const cells = monthDays(cursor.getFullYear(), cursor.getMonth());
  const monthLabel = cursor.toLocaleDateString(lang === "hy" ? "hy-AM" : lang === "ru" ? "ru-RU" : "en-GB", {
    month: "long",
    year: "numeric",
  });
  const weekdays = Array.from({ length: 7 }, (_, i) =>
    new Date(2024, 0, 1 + i).toLocaleDateString(lang === "hy" ? "hy-AM" : lang === "ru" ? "ru-RU" : "en-GB", { weekday: "short" }),
  );
  const monthDates = cells.filter(Boolean).map((d) => iso(d as Date));

  return (
    <div className="container-page py-10">
      <Link to="/owner" className="text-sm text-muted-foreground hover:text-foreground">← {t("cal.back")}</Link>
      <h1 className="mt-2 font-display text-3xl font-semibold">{t("cal.title")}</h1>
      <p className="mt-1 text-muted-foreground">{property.data.name}</p>
      <p className="text-sm text-muted-foreground">{t("cal.subtitle")}</p>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <Button variant={mode === "BLOCKED" ? "default" : "outline"} onClick={() => setMode("BLOCKED")}>
          {t("cal.blocked")}
        </Button>
        <Button variant={mode === "AVAILABLE" ? "default" : "outline"} onClick={() => setMode("AVAILABLE")}>
          {t("cal.free")}
        </Button>
        <span className="text-sm text-muted-foreground">{t("cal.mode")}</span>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card p-3 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <Button aria-label="Previous month" variant="ghost" size="icon" className="size-11 shrink-0 text-xl" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}>←</Button>
          <p className="min-w-0 text-center font-display text-base font-semibold capitalize sm:text-lg">{monthLabel}</p>
          <Button aria-label="Next month" variant="ghost" size="icon" className="size-11 shrink-0 text-xl" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}>→</Button>
        </div>

        <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
          {weekdays.map((w) => <div key={w} className="py-1">{w}</div>)}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {cells.map((d, i) => {
            if (!d) return <div key={`e${i}`} />;
            const key = iso(d);
            const isBlocked = blocked.has(key);
            const past = key < iso(today);
            return (
              <Button
                key={key}
                type="button"
                variant="outline"
                size="icon"
                disabled={past || save.isPending}
                onClick={() => save.mutate({ dates: [key], status: isBlocked ? "AVAILABLE" : mode })}
                className={[
                  "aspect-square h-auto min-h-10 w-full rounded-lg p-0 text-xs transition touch-manipulation sm:text-sm",
                  past ? "cursor-not-allowed border-transparent text-muted-foreground/40" : "hover:border-primary",
                  isBlocked
                    ? "border-destructive/40 bg-destructive/10 text-destructive line-through"
                    : "border-border bg-background",
                ].join(" ")}
              >
                {d.getDate()}
              </Button>
            );
          })}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-4 text-sm">
          <span className="flex items-center gap-2"><span className="size-3 rounded border border-border bg-background" />{t("cal.legendFree")}</span>
          <span className="flex items-center gap-2"><span className="size-3 rounded border border-destructive/40 bg-destructive/20" />{t("cal.legendBlocked")}</span>
          <div className="grid w-full grid-cols-1 gap-2 sm:ms-auto sm:flex sm:w-auto">
            <Button variant="outline" size="sm" className="min-h-11 whitespace-normal" disabled={save.isPending} onClick={() => save.mutate({ dates: monthDates, status: "BLOCKED" })}>
              {t("cal.blockMonth")}
            </Button>
            <Button variant="outline" size="sm" className="min-h-11 whitespace-normal" disabled={save.isPending} onClick={() => save.mutate({ dates: monthDates, status: "AVAILABLE" })}>
              {t("cal.clearMonth")}
            </Button>
          </div>
        </div>
        {save.isPending && <p className="mt-3 text-sm text-muted-foreground">{t("cal.saving")}</p>}
      </div>
    </div>
  );
}
