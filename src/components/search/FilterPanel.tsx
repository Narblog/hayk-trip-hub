import { useQuery } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">{title}</h3>
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

  return (
    <div className="text-sm">
      <div className="flex items-center justify-between pb-4">
        <h2 className="font-display text-xl">{t("search.filters")}</h2>
        <Button variant="ghost" size="sm" onClick={onClear} className="text-xs">
          {t("search.clear")}
        </Button>
      </div>

      <Group title={t("filters.price")}>
        <Slider
          value={[values.minPrice, values.maxPrice]}
          min={PRICE_MIN}
          max={PRICE_MAX}
          step={5000}
          onValueChange={([min, max]) => onChange({ minPrice: min ?? PRICE_MIN, maxPrice: max ?? PRICE_MAX })}
        />
        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>{formatPrice(values.minPrice, "AMD", lang)}</span>
          <span>
            {formatPrice(values.maxPrice, "AMD", lang)}
            {values.maxPrice >= PRICE_MAX ? "+" : ""}
          </span>
        </div>
      </Group>

      <Group title={t("filters.type")}>
        <div className="grid gap-2">
          {(ref?.types ?? []).map((ty) => (
            <label key={ty.code} className="flex cursor-pointer items-center gap-2.5">
              <Checkbox checked={values.types.includes(ty.code)} onCheckedChange={() => toggle("types", ty.code)} />
              <span>{localized(ty, "name")}</span>
            </label>
          ))}
        </div>
      </Group>

      <Group title={t("filters.bedrooms")}>
        <div className="flex flex-wrap gap-1.5">
          {[0, 1, 2, 3, 4].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onChange({ bedrooms: n })}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-medium ${
                values.bedrooms === n ? "border-brand bg-brand-soft text-brand" : "border-border hover:bg-surface"
              }`}
            >
              {n === 0 ? t("filters.any") : `${n}+`}
            </button>
          ))}
        </div>
      </Group>

      <Group title={t("filters.rating")}>
        <div className="flex flex-wrap gap-1.5">
          {[0, 4, 4.5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onChange({ minRating: n })}
              className={`flex items-center gap-1 rounded-full border px-3.5 py-1.5 text-xs font-medium ${
                values.minRating === n ? "border-brand bg-brand-soft text-brand" : "border-border hover:bg-surface"
              }`}
            >
              {n === 0 ? (
                t("filters.any")
              ) : (
                <>
                  <Star className="size-3 fill-gold text-gold" /> {n}+
                </>
              )}
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
