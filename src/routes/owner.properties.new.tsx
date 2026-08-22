import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useRef, useState } from "react";
import { Check, ImagePlus, Star, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { InlineLoader } from "@/components/common/states";
import { AmenityIcon } from "@/components/property/AmenityIcon";
import { LocationField } from "@/components/property/LocationField";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { refDataQuery } from "@/lib/data";
import { slugify } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/owner/properties/new")({
  head: () => ({
    meta: [
      { title: "List your property in Armenia — StayLand" },
      { name: "description", content: "Publish your Armenian hotel, guesthouse, cabin, villa or apartment and reach travellers directly." },
      { property: "og:title", content: "List your property — StayLand" },
      { property: "og:description", content: "Reach travellers looking for Armenian stays." },
    ],
  }),
  component: NewPropertyPage,
});

function NewPropertyPage() {
  const { t, localized } = useI18n();
  const { user, isOwner } = useAuth();
  const navigate = useNavigate();
  const { data: ref, isPending } = useQuery(refDataQuery());
  const [saving, setSaving] = useState(false);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [photos, setPhotos] = useState<{ url: string; path: string }[]>([]);
  const [mainPhoto, setMainPhoto] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);
  const [coords, setCoords] = useState<{ lat: number | null; lng: number | null }>({ lat: null, lng: null });
  const [form, setForm] = useState({
    name: "",
    property_type: "",
    region_code: "",
    city_code: "",
    address: "",
    description: "",
    price_per_night: "",
    max_guests: "2",
    bedrooms: "1",
    beds: "1",
    bathrooms: "1",
    main_image_url: "",
    contact_phone: "",
    contact_whatsapp: "",
    contact_instagram: "",
  });

  const set = (k: keyof typeof form, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => {
      if (!e[k]) return e;
      const next = { ...e };
      delete next[k];
      return next;
    });
  };

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e['name'] = t("form.errName");
    if (!form.property_type) e['property_type'] = t("form.errType");
    if (!form.city_code) e['city_code'] = t("form.errCity");
    if (!form.price_per_night || Number(form.price_per_night) <= 0) e['price_per_night'] = t("form.errPrice");
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function uploadFiles(files: FileList | null) {
    if (!files?.length || !user) return;
    setUploading(true);
    try {
      const added: { url: string; path: string }[] = [];
      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop() ?? "jpg";
        const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from("property-images").upload(path, file, {
          cacheControl: "3600",
          upsert: false,
        });
        if (error) throw error;
        const { data: signed, error: signErr } = await supabase.storage
          .from("property-images")
          .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
        if (signErr || !signed) throw signErr ?? new Error("sign failed");
        added.push({ url: signed.signedUrl, path });
      }
      setPhotos((prev) => [...prev, ...added]);
      setMainPhoto((m) => m || added[0]?.url || "");
    } catch (e) {
      toast.error(`${t("form.uploadError")}: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function removePhoto(p: { url: string; path: string }) {
    setPhotos((prev) => prev.filter((x) => x.path !== p.path));
    setMainPhoto((m) => (m === p.url ? "" : m));
    await supabase.storage.from("property-images").remove([p.path]);
  }

  const cities = useMemo(
    () => (ref?.cities ?? []).filter((c) => !form.region_code || c.region_code === form.region_code),
    [ref, form.region_code],
  );

  async function save(status: "DRAFT" | "PENDING_REVIEW") {
    if (!user) return;
    if (!validate()) {
      toast.error(t("form.required"));
      return;
    }
    setSaving(true);
    try {
      const city = (ref?.cities ?? []).find((c) => c.code === form.city_code);
      const { data, error } = await supabase
        .from("properties")
        .insert({
          owner_id: user.id,
          name: form.name.trim(),
          slug: `${slugify(form.name)}-${Math.random().toString(36).slice(2, 8)}`,
          description: form.description || null,
          property_type: form.property_type,
          city_code: form.city_code,
          region_code: form.region_code || city?.region_code || null,
          address: form.address || null,
          price_per_night: Number(form.price_per_night),
          max_guests: Number(form.max_guests) || 1,
          bedrooms: Number(form.bedrooms) || 0,
          beds: Number(form.beds) || 0,
          bathrooms: Number(form.bathrooms) || 0,
          main_image_url: mainPhoto || form.main_image_url || null,
          contact_phone: form.contact_phone || null,
          contact_whatsapp: form.contact_whatsapp || null,
          contact_instagram: form.contact_instagram || null,
          status,
          submitted_at: status === "PENDING_REVIEW" ? new Date().toISOString() : null,
        })
        .select("id")
        .single();
      if (error) throw error;
      const uniqueAmenities = Array.from(new Set(amenities));
      if (uniqueAmenities.length && data) {
        const { error: amenitiesError } = await supabase
          .from("property_amenities")
          .upsert(
            uniqueAmenities.map((code) => ({ property_id: data.id, amenity_code: code })),
            { onConflict: "property_id,amenity_code", ignoreDuplicates: true },
          );
        if (amenitiesError) throw amenitiesError;
      }
      if (photos.length && data) {
        const { error: imagesError } = await supabase.from("property_images").insert(
          photos.map((ph, i) => ({
            property_id: data.id,
            image_url: ph.url,
            storage_path: ph.path,
            sort_order: i,
            is_cover: ph.url === (mainPhoto || photos[0]?.url),
          })),
        );
        if (imagesError) throw imagesError;
      }
      toast.success(status === "DRAFT" ? t("form.savedDraft") : t("form.submitted"));
      void navigate({ to: "/owner" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  if (!user)
    return (
      <div className="container-page max-w-2xl py-20 text-center">
        <h1 className="font-display text-3xl font-semibold">{t("nav.listProperty")}</h1>
        <p className="mt-3 text-muted-foreground">{t("home.ownerCtaSub")}</p>
        <Button asChild className="mt-6">
          <Link to="/auth" search={{ mode: "register" }}>{t("nav.register")}</Link>
        </Button>
      </div>
    );

  if (isPending) return <InlineLoader />;

  if (!isOwner)
    return (
      <div className="container-page max-w-xl py-20 text-center">
        <h1 className="font-display text-3xl font-semibold">{t("owner.notHostTitle")}</h1>
        <p className="mt-3 text-muted-foreground">{t("owner.notHostSub")}</p>
        <Button asChild className="mt-6"><Link to="/owner">{t("owner.becomeHost")}</Link></Button>
      </div>
    );

  const section = "rounded-2xl border border-border bg-card p-5 space-y-4";
  const selectCls =
    "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";
  const errCls = "border-destructive focus-visible:ring-destructive";
  const FieldError = ({ id }: { id: string }) =>
    errors[id] ? <p className="text-xs font-medium text-destructive">{errors[id]}</p> : null;

  return (
    <div className="container-page max-w-3xl py-10">
      <h1 className="font-display text-3xl font-semibold">{t("nav.listProperty")}</h1>

      <form
        className="mt-6 space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          void save("PENDING_REVIEW");
        }}
      >
        <div className={section}>
          <h2 className="font-display text-lg font-semibold">{t("form.basics")}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">{t("form.name")} *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                aria-invalid={!!errors['name']}
                className={errors['name'] ? errCls : undefined}
              />
              <FieldError id="name" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="type">{t("form.type")} *</Label>
              <select
                id="type"
                className={`${selectCls} ${errors['property_type'] ? errCls : ""}`}
                aria-invalid={!!errors['property_type']}
                value={form.property_type}
                onChange={(e) => set("property_type", e.target.value)}
              >
                <option value="">{t("form.select")}</option>
                {(ref?.types ?? []).map((ty) => (
                  <option key={ty.code} value={ty.code}>
                    {localized(ty, "name")}
                  </option>
                ))}
              </select>
              <FieldError id="property_type" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">{t("form.description")}</Label>
            <Textarea id="description" rows={4} value={form.description} onChange={(e) => set("description", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="img">{t("form.mainImage")}</Label>
            <Input id="img" value={form.main_image_url} onChange={(e) => set("main_image_url", e.target.value)} placeholder="https://…" />
          </div>
        </div>

        <div className={section}>
          <h2 className="font-display text-lg font-semibold">{t("form.photos")}</h2>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => void uploadFiles(e.target.files)}
          />
          <Button
            type="button"
            variant="outline"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
          >
            <ImagePlus className="mr-2 h-4 w-4" />
            {uploading ? t("form.uploading") : t("form.uploadPhotos")}
          </Button>

          {photos.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-3">
              {photos.map((ph) => {
                const isMain = ph.url === mainPhoto;
                return (
                  <div key={ph.path} className="overflow-hidden rounded-xl border border-border">
                    <div className="relative aspect-[4/3]">
                      <img src={ph.url} alt={form.name || "photo"} className="h-full w-full object-cover" />
                      {isMain && (
                        <span className="absolute left-2 top-2 rounded-full bg-primary px-2 py-0.5 text-[11px] font-medium text-primary-foreground">
                          {t("form.mainPhoto")}
                        </span>
                      )}
                      <button
                        type="button"
                        aria-label={t("form.removePhoto")}
                        onClick={() => void removePhoto(ph)}
                        className="absolute right-2 top-2 rounded-full bg-background/85 p-1.5 text-foreground shadow-sm"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <Button
                      type="button"
                      variant={isMain ? "secondary" : "ghost"}
                      size="sm"
                      className="w-full rounded-none"
                      disabled={isMain}
                      onClick={() => setMainPhoto(ph.url)}
                    >
                      <Star className={`mr-2 h-3.5 w-3.5 ${isMain ? "fill-current" : ""}`} />
                      {isMain ? t("form.mainPhoto") : t("form.setMain")}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className={section}>
          <h2 className="font-display text-lg font-semibold">{t("form.location")}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="region">{t("form.region")}</Label>
              <select
                id="region"
                className={selectCls}
                value={form.region_code}
                onChange={(e) => {
                  set("region_code", e.target.value);
                  set("city_code", "");
                }}
              >
                <option value="">{t("form.select")}</option>
                {(ref?.regions ?? []).map((r) => (
                  <option key={r.code} value={r.code}>
                    {localized(r, "name")}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="city">{t("form.city")} *</Label>
              <select
                id="city"
                className={`${selectCls} ${errors['city_code'] ? errCls : ""}`}
                aria-invalid={!!errors['city_code']}
                value={form.city_code}
                onChange={(e) => set("city_code", e.target.value)}
              >
                <option value="">{t("form.select")}</option>
                {cities.map((c) => (
                  <option key={c.code} value={c.code}>
                    {localized(c, "name")}
                  </option>
                ))}
              </select>
              <FieldError id="city_code" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="address">{t("form.address")}</Label>
            <Input id="address" value={form.address} onChange={(e) => set("address", e.target.value)} />
          </div>
          <LocationField lat={coords.lat} lng={coords.lng} onChange={(lat, lng) => setCoords({ lat, lng })} />
        </div>

        <div className={section}>
          <h2 className="font-display text-lg font-semibold">{t("form.capacity")}</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {([
              ["price_per_night", t("form.price")],
              ["max_guests", t("form.maxGuests")],
              ["bedrooms", t("form.bedrooms")],
              ["beds", t("form.beds")],
              ["bathrooms", t("form.bathrooms")],
            ] as const).map(([key, label]) => (
              <div key={key} className="space-y-1.5">
                <Label htmlFor={key}>{label}</Label>
                <Input
                  id={key}
                  type="number"
                  min={key === "price_per_night" ? 0 : 0}
                  value={form[key]}
                  onChange={(e) => set(key, e.target.value)}
                  aria-invalid={!!errors[key]}
                  className={errors[key] ? errCls : undefined}
                />
                <FieldError id={key} />
              </div>
            ))}
          </div>
        </div>

        <div className={section}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-display text-lg font-semibold">{t("form.amenities")}</h2>
            <p className="text-xs text-muted-foreground">
              {t("form.amenitiesHint")} · {amenities.length} {t("form.amenitiesSelected")}
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            {(ref?.amenities ?? []).map((a) => (
              <button
                key={a.code}
                type="button"
                aria-pressed={amenities.includes(a.code)}
                onClick={() =>
                  setAmenities((prev) =>
                    prev.includes(a.code)
                      ? prev.filter((c) => c !== a.code)
                      : Array.from(new Set([...prev, a.code])),
                  )
                }
                className={`flex items-center gap-3 rounded-2xl border p-3 text-left text-sm transition-colors ${
                  amenities.includes(a.code)
                    ? "border-brand bg-brand/10 text-foreground"
                    : "border-border bg-card hover:border-brand/50"
                }`}
              >
                <span
                  className={`flex size-9 shrink-0 items-center justify-center rounded-xl border ${
                    amenities.includes(a.code) ? "border-brand/40 bg-brand/15 text-brand" : "border-border text-muted-foreground"
                  }`}
                >
                  <AmenityIcon icon={(a as { icon?: string }).icon} className="size-4.5" />
                </span>
                <span className="min-w-0 flex-1 truncate">{localized(a, "name")}</span>
                {amenities.includes(a.code) ? <Check className="size-4 shrink-0 text-brand" /> : null}
              </button>
            ))}
          </div>
        </div>

        <div className={section}>
          <h2 className="font-display text-lg font-semibold">{t("form.contact")}</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="phone">{t("form.phone")}</Label>
              <Input id="phone" value={form.contact_phone} onChange={(e) => set("contact_phone", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wa">{t("form.whatsapp")}</Label>
              <Input id="wa" value={form.contact_whatsapp} onChange={(e) => set("contact_whatsapp", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ig">{t("form.instagram")}</Label>
              <Input id="ig" value={form.contact_instagram} onChange={(e) => set("contact_instagram", e.target.value)} />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={saving}>{t("form.submit")}</Button>
          <Button type="button" variant="outline" disabled={saving} onClick={() => void save("DRAFT")}>
            {t("form.saveDraft")}
          </Button>
          <Button asChild type="button" variant="ghost">
            <Link to="/owner">{t("common.cancel")}</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
