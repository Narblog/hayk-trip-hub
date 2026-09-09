import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const parseISO = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

export function DatePicker({
  value,
  onChange,
  min,
  placeholder,
  label,
  className,
  buttonClassName,
  hideIcon = false,
}: {
  value: string;
  onChange: (isoValue: string) => void;
  min?: string;
  placeholder?: string;
  label?: string;
  className?: string;
  buttonClassName?: string;
  hideIcon?: boolean;
}) {
  const { lang } = useI18n();
  const locale = lang === "hy" ? "hy-AM" : lang === "ru" ? "ru-RU" : "en-GB";
  const today = new Date();
  const [open, setOpen] = useState(false);
  const base = value ? parseISO(value) : today;
  const [cursor, setCursor] = useState(new Date(base.getFullYear(), base.getMonth(), 1));

  const weekdays = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) =>
        new Date(2024, 0, 1 + i).toLocaleDateString(locale, { weekday: "short" }),
      ),
    [locale],
  );

  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const lead = (first.getDay() + 6) % 7;
  const total = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  const cells: (Date | null)[] = Array.from({ length: lead }, () => null);
  for (let d = 1; d <= total; d++) cells.push(new Date(cursor.getFullYear(), cursor.getMonth(), d));

  const display = value
    ? parseISO(value).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" })
    : null;

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) {
          const b = value ? parseISO(value) : today;
          setCursor(new Date(b.getFullYear(), b.getMonth(), 1));
        }
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={label || placeholder || "date"}
          className={cn(
            "flex h-10 w-full items-center gap-2 rounded-md border border-input bg-background px-3 text-left text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring",
            buttonClassName,
          )}
        >
          {hideIcon ? null : <CalendarDays className="size-4 shrink-0 text-muted-foreground" />}
          <span className={cn("min-w-0 flex-1 truncate", !display && "text-muted-foreground")}>
            {display ?? placeholder ?? ""}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className={cn("w-[19rem] p-3", className)}>
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            aria-label="Previous month"
            className="flex size-8 items-center justify-center rounded-md hover:bg-accent"
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
          >
            <ChevronLeft className="size-4" />
          </button>
          <p className="text-sm font-medium capitalize">
            {cursor.toLocaleDateString(locale, { month: "long", year: "numeric" })}
          </p>
          <button
            type="button"
            aria-label="Next month"
            className="flex size-8 items-center justify-center rounded-md hover:bg-accent"
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
        <div className="mt-2 grid grid-cols-7 gap-0.5 text-center text-[11px] text-muted-foreground">
          {weekdays.map((w, i) => (
            <div key={`${w}-${i}`} className="py-1 capitalize">
              {w}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {cells.map((d, i) => {
            if (!d) return <div key={`x${i}`} />;
            const key = iso(d);
            const disabled = !!min && key < min;
            const selected = key === value;
            return (
              <button
                key={key}
                type="button"
                disabled={disabled}
                onClick={() => {
                  onChange(key);
                  setOpen(false);
                }}
                className={cn(
                  "flex h-8 items-center justify-center rounded-md text-sm transition-colors",
                  selected
                    ? "bg-primary font-semibold text-primary-foreground"
                    : "hover:bg-accent",
                  disabled && "cursor-not-allowed opacity-30 hover:bg-transparent",
                )}
              >
                {d.getDate()}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
