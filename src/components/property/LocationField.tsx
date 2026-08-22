import { lazy, Suspense } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { Crosshair, MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/lib/i18n";

const LocationPicker = lazy(() => import("@/components/property/LocationPicker"));

export function LocationField({
  lat,
  lng,
  onChange,
}: {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number | null, lng: number | null) => void;
}) {
  const { t } = useI18n();

  const locate = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) =>
      onChange(Number(pos.coords.latitude.toFixed(6)), Number(pos.coords.longitude.toFixed(6))),
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label>{t("form.mapPick")}</Label>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={locate}>
            <Crosshair className="size-4" /> {t("form.mapLocate")}
          </Button>
          {lat != null && lng != null && (
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null, null)}>
              <X className="size-4" /> {t("form.mapClear")}
            </Button>
          )}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{t("form.mapHint")}</p>
      <ClientOnly fallback={<Skeleton className="h-[320px] w-full rounded-2xl" />}>
        <Suspense fallback={<Skeleton className="h-[320px] w-full rounded-2xl" />}>
          <LocationPicker
            key={lat == null || lng == null ? "empty" : "set"}
            lat={lat}
            lng={lng}
            onChange={(a, b) => onChange(a, b)}
          />
        </Suspense>
      </ClientOnly>
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <MapPin className="size-3.5" />
        {lat != null && lng != null ? `${lat}, ${lng}` : t("form.mapNoPin")}
      </p>
    </div>
  );
}
