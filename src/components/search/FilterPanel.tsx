import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { AmenityIcon } from "@/components/property/AmenityIcon";
import { refDataQuery } from "@/lib/data";
import { formatPrice } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

export type FilterValues = {
  types: string[];
  amenities: string[];
  minPrice: number;
  maxPrice: number;
  bedrooms: number;
  minRating: number;
};

export const PRICE_MIN = 0;
export const PRICE_MAX = 200000;

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-border/70 py-5 first:border-t-0 first:pt-0">
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      {children}
    </div>
  );
}

export function FilterPanel({
  values,
  onChange,
  onClear,
}: {
  values: FilterValues;
  onChange: (patch: Partial<FilterValues>) => void;
  onClear: () => void;
}) {
  const { t, lang, localized } = useI18n();
  const { data: ref } = useQuery(refDataQuery());

  const toggle = (key: "types" | "amenities", code: string) => {
    const list = values[key];
    onChange({ [key]: list.includes(code) ? list.filter((c) => c !== code) : [...list, code] } as Partial<FilterValues>);
  };

  const pill = (active: boolean) =>
    `rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
      active ? "bg-brand text-brand-foreground" : "bg-surface text-foreground hover:bg-accent"
    }`;

  return (
    <div className="text-sm">
      <div className="flex items-center justify-between pb-4">
        <h2 className="font-display text-xl">{t("search.filters")}</h2>
        <Button variant="ghost" size="sm" onClick={onClear} className="text-xs">
          {t("search.clear")}
        </Button>
      </div>

      <Group title={t("filters.type")}>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => onChange({ types: [] })}
            className={pill(values.types.length === 0)}
          >
            {t("filters.any")}
          </button>
          {(ref?.types ?? []).map((ty) => (
            <button
              key={ty.code}
              type="button"
              onClick={() => toggle("types", ty.code)}
              className={pill(values.types.includes(ty.code))}
            >
              {localized(ty, "name")}
            </button>
          ))}
        </div>
      </Group>

      <Group title={t("filters.price")}>
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{t("filters.priceFrom")}</p>
            <p className="truncate text-xs font-semibold">{formatPrice(values.minPrice, "AMD", lang)}</p>
          </div>
          <div className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{t("filters.priceTo")}</p>
            <p className="truncate text-xs font-semibold">
              {formatPrice(values.maxPrice, "AMD", lang)}
              {values.maxPrice >= PRICE_MAX ? "+" : ""}
            </p>
          </div>
        </div>
        <Slider
          className="mt-4"
          value={[values.minPrice, values.maxPrice]}
          min={PRICE_MIN}
          max={PRICE_MAX}
          step={5000}
          onValueChange={([min, max]) => onChange({ minPrice: min ?? PRICE_MIN, maxPrice: max ?? PRICE_MAX })}
        />
      </Group>

      <Group title={t("filters.bedrooms")}>
        <div className="flex flex-wrap gap-1.5">
          {[0, 1, 2, 3, 4].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onChange({ bedrooms: n })}
              className={pill(values.bedrooms === n)}
            >
              {n === 0 ? t("filters.any") : `${n}+`}
            </button>
          ))}
        </div>
      </Group>

      <Group title={t("filters.amenities")}>
        <div className="grid grid-cols-2 gap-2">
          {(ref?.amenities ?? []).map((a) => {
            const active = values.amenities.includes(a.code);
            return (
              <button
                key={a.code}
                type="button"
                onClick={() => toggle("amenities", a.code)}
                className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs font-medium ${
                  active ? "border-brand bg-brand-soft text-brand" : "border-border hover:bg-surface"
                }`}
              >
                <AmenityIcon icon={a.icon} className="size-4 shrink-0" />
                <span className="line-clamp-1">{localized(a, "name")}</span>
              </button>
            );
          })}
        </div>
      </Group>
    </div>
  );
}
