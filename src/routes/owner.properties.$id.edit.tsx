import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, ImagePlus, Star, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { InlineLoader } from "@/components/common/states";
import { StatusBadge } from "@/components/common/StatusBadge";
import { AmenityIcon } from "@/components/property/AmenityIcon";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { refDataQuery } from "@/lib/data";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/owner/properties/$id/edit")({
  head: () => ({
    meta: [
      { title: "Edit your listing — Hyur Armenia" },
      { name: "description", content: "Update your Armenian stay: photos, price, amenities, location and contact details." },
      { property: "og:title", content: "Edit your listing — Hyur" },
      { property: "og:description", content: "Keep your Armenian listing accurate and up to date." },
    ],
  }),
  component: EditPropertyPage,
});

type Photo = { id?: string; url: string; path: string | null };

function EditPropertyPage() {
  const { id } = Route.useParams();
  const { t, localized } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: ref } = useQuery(refDataQuery());
  const fileRef = useRef<HTMLInputElement>(null);

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [amenities, setAmenities] = useState<string[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [mainPhoto, setMainPhoto] = useState("");
  const [removedPaths, setRemovedPaths] = useState<string[]>([]);
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
    contact_phone: "",
    contact_whatsapp: "",
    contact_instagram: "",
  });

  const detail = useQuery({
    queryKey: ["owner-property-edit", id],
    enabled: !!user,
    queryFn: async () => {
      const [{ data: property, error }, images, amen] = await Promise.all([
        supabase.from("properties").select("*").eq("id", id).maybeSingle(),
        supabase.from("property_images").select("*").eq("property_id", id).order("sort_order"),
        supabase.from("property_amenities").select("amenity_code").eq("property_id", id),
      ]);
      if (error) throw error;
      return {
        property,
        images: images.data ?? [],
        amenities: (amen.data ?? []).map((a) => a.amenity_code as string),
      };
    },
  });

  const property = detail.data?.property;

  useEffect(() => {
    if (!property) return;
    setForm({
      name: property.name ?? "",
      property_type: property.property_type ?? "",
      region_code: property.region_code ?? "",
      city_code: property.city_code ?? "",
      address: property.address ?? "",
      description: property.description ?? "",
      price_per_night: String(property.price_per_night ?? ""),
      max_guests: String(property.max_guests ?? 1),
      bedrooms: String(property.bedrooms ?? 0),
      beds: String(property.beds ?? 0),
      bathrooms: String(property.bathrooms ?? 0),
      contact_phone: property.contact_phone ?? "",
      contact_whatsapp: property.contact_whatsapp ?? "",
      contact_instagram: property.contact_instagram ?? "",
    });
    const imgs = (detail.data?.images ?? []) as { id: string; image_url: string; storage_path: string | null; is_cover: boolean }[];
    setPhotos(imgs.map((i) => ({ id: i.id, url: i.image_url, path: i.storage_path })));
    setMainPhoto(property.main_image_url ?? imgs.find((i) => i.is_cover)?.image_url ?? imgs[0]?.image_url ?? "");
    setAmenities(detail.data?.amenities ?? []);
  }, [property, detail.data]);

  const set = (k: keyof typeof form, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => {
      if (!e[k]) return e;
      const next = { ...e };
      delete next[k];
      return next;
    });
  };

  const cities = useMemo(
    () => (ref?.cities ?? []).filter((c) => !form.region_code || c.region_code === form.region_code),
    [ref, form.region_code],
  );

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
      const added: Photo[] = [];
      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop() ?? "jpg";
        const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from("property-images").upload(path, file, { cacheControl: "3600" });
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

  function removePhoto(index: number) {
    setPhotos((prev) => {
      const ph = prev[index];
      if (ph?.path) setRemovedPaths((r) => [...r, ph.path!]);
      if (ph) setMainPhoto((m) => (m === ph.url ? prev.filter((_, i) => i !== index)[0]?.url ?? "" : m));
      return prev.filter((_, i) => i !== index);
    });
  }

  function movePhoto(index: number, dir: -1 | 1) {
    setPhotos((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      const a = next[index]!;
      next[index] = next[target]!;
      next[target] = a;
      return next;
    });
  }

  async function save() {
    if (!property) return;
    if (!validate()) {
      toast.error(t("form.required"));
      return;
    }
    setSaving(true);
    try {
      const city = (ref?.cities ?? []).find((c) => c.code === form.city_code);
      const cover = mainPhoto || photos[0]?.url || null;
      const { error } = await supabase
        .from("properties")
        .update({
          name: form.name.trim(),
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
          main_image_url: cover,
          contact_phone: form.contact_phone || null,
          contact_whatsapp: form.contact_whatsapp || null,
          contact_instagram: form.contact_instagram || null,
        })
        .eq("id", property.id);
      if (error) throw error;

      // amenities: replace set
      const unique = Array.from(new Set(amenities));
      const { error: delAmen } = await supabase.from("property_amenities").delete().eq("property_id", property.id);
      if (delAmen) throw delAmen;
      if (unique.length) {
        const { error: insAmen } = await supabase
          .from("property_amenities")
          .insert(unique.map((code) => ({ property_id: property.id, amenity_code: code })));
        if (insAmen) throw insAmen;
      }

      // images: replace rows with current order
      const { error: delImg } = await supabase.from("property_images").delete().eq("property_id", property.id);
      if (delImg) throw delImg;
      if (photos.length) {
        const { error: insImg } = await supabase.from("property_images").insert(
          photos.map((ph, i) => ({
            property_id: property.id,
            image_url: ph.url,
            storage_path: ph.path,
            sort_order: i,
            is_cover: ph.url === cover,
          })),
        );
        if (insImg) throw insImg;
      }
      if (removedPaths.length) {
        await supabase.storage.from("property-images").remove(removedPaths);
        setRemovedPaths([]);
      }

      await queryClient.invalidateQueries({ queryKey: ["owner-properties"] });
      await queryClient.invalidateQueries({ queryKey: ["owner-property-edit", id] });
      await queryClient.invalidateQueries({ queryKey: ["property"] });
      toast.success(t("form.saved"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  async function toggleVisibility() {
    if (!property) return;
    const { error } = await supabase.from("properties").update({ is_active: !property.is_active }).eq("id", property.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["owner-property-edit", id] });
    await queryClient.invalidateQueries({ queryKey: ["owner-properties"] });
    await detail.refetch();
  }

  async function submitForReview() {
    if (!property) return;
    const { error } = await supabase
      .from("properties")
      .update({ status: "PENDING_REVIEW", submitted_at: new Date().toISOString() })
      .eq("id", property.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(t("form.submitted"));
    await detail.refetch();
    await queryClient.invalidateQueries({ queryKey: ["owner-properties"] });
  }

  async function deleteProperty() {
    if (!property) return;
    if (!window.confirm(t("owner.deleteConfirm"))) return;
    const paths = photos.map((p) => p.path).filter((p): p is string => !!p);
    const { error } = await supabase.from("properties").delete().eq("id", property.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (paths.length) await supabase.storage.from("property-images").remove(paths);
    await queryClient.invalidateQueries({ queryKey: ["owner-properties"] });
    toast.success(t("owner.deleted"));
    void navigate({ to: "/owner" });
  }

  if (!user)
    return (
      <div className="container-page py-16 text-center">
        <Button asChild><Link to="/auth">{t("nav.login")}</Link></Button>
      </div>
    );

  if (detail.isPending) return <InlineLoader />;

  if (!property)
    return (
      <div className="container-page max-w-xl py-20 text-center">
        <h1 className="font-display text-2xl font-semibold">{t("owner.notFound")}</h1>
        <Button asChild className="mt-6"><Link to="/owner">{t("owner.dashboard")}</Link></Button>
      </div>
    );

  const section = "rounded-2xl border border-border bg-card p-5 space-y-4";
  const selectCls =
    "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";
  const errCls = "border-destructive focus-visible:ring-destructive";
  const FieldError = ({ id: fid }: { id: string }) =>
    errors[fid] ? <p className="text-xs font-medium text-destructive">{errors[fid]}</p> : null;

  return (
    <div className="container-page max-w-3xl py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold">{t("owner.editProperty")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("owner.editSub")}</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={property.status} />
          <Button asChild variant="outline" size="sm">
            <Link to="/owner/properties/$id/calendar" params={{ id: property.id }}>{t("owner.openCalendar")}</Link>
          </Button>
          {property.slug ? (
            <Button asChild variant="ghost" size="sm">
              <Link to="/property/$slug" params={{ slug: property.slug }}>{t("owner.preview")}</Link>
            </Button>
          ) : null}
        </div>
      </div>

      <form
        className="mt-6 space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        <div className={section}>
          <h2 className="font-display text-lg font-semibold">{t("form.basics")}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">{t("form.name")} *</Label>
              <Input id="name" value={form.name} onChange={(e) => set("name", e.target.value)} className={errors['name'] ? errCls : undefined} />
              <FieldError id="name" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="type">{t("form.type")} *</Label>
              <select
                id="type"
                className={`${selectCls} ${errors['property_type'] ? errCls : ""}`}
                value={form.property_type}
                onChange={(e) => set("property_type", e.target.value)}
              >
                <option value="">{t("form.select")}</option>
                {(ref?.types ?? []).map((ty) => (
                  <option key={ty.code} value={ty.code}>{localized(ty, "name")}</option>
                ))}
              </select>
              <FieldError id="property_type" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">{t("form.description")}</Label>
            <Textarea id="description" rows={4} value={form.description} onChange={(e) => set("description", e.target.value)} />
          </div>
        </div>

        <div className={section}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-display text-lg font-semibold">{t("form.photos")}</h2>
            <p className="text-xs text-muted-foreground">{t("form.photosHint")}</p>
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => void uploadFiles(e.target.files)} />
          <Button type="button" variant="outline" disabled={uploading} onClick={() => fileRef.current?.click()}>
            <ImagePlus className="mr-2 h-4 w-4" />
            {uploading ? t("form.uploading") : t("form.uploadPhotos")}
          </Button>

          {photos.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-3">
              {photos.map((ph, i) => {
                const isMain = ph.url === mainPhoto;
                return (
                  <div key={ph.url} className="overflow-hidden rounded-xl border border-border">
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
                        onClick={() => removePhoto(i)}
                        className="absolute right-2 top-2 rounded-full bg-background/85 p-1.5 text-foreground shadow-sm"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                      <div className="absolute bottom-2 left-2 flex gap-1">
                        <button
                          type="button"
                          aria-label={t("form.movePhotoLeft")}
                          disabled={i === 0}
                          onClick={() => movePhoto(i, -1)}
                          className="rounded-full bg-background/85 p-1.5 disabled:opacity-40"
                        >
                          <ArrowLeft className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          aria-label={t("form.movePhotoRight")}
                          disabled={i === photos.length - 1}
                          onClick={() => movePhoto(i, 1)}
                          className="rounded-full bg-background/85 p-1.5 disabled:opacity-40"
                        >
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
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
                  <option key={r.code} value={r.code}>{localized(r, "name")}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="city">{t("form.city")} *</Label>
              <select
                id="city"
                className={`${selectCls} ${errors['city_code'] ? errCls : ""}`}
                value={form.city_code}
                onChange={(e) => set("city_code", e.target.value)}
              >
                <option value="">{t("form.select")}</option>
                {cities.map((c) => (
                  <option key={c.code} value={c.code}>{localized(c, "name")}</option>
                ))}
              </select>
              <FieldError id="city_code" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="address">{t("form.address")}</Label>
            <Input id="address" value={form.address} onChange={(e) => set("address", e.target.value)} />
          </div>
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
                  min={0}
                  value={form[key]}
                  onChange={(e) => set(key, e.target.value)}
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
            <p className="text-xs text-muted-foreground">{amenities.length} {t("form.amenitiesSelected")}</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            {(ref?.amenities ?? []).map((a) => {
              const on = amenities.includes(a.code);
              return (
                <button
                  key={a.code}
                  type="button"
                  aria-pressed={on}
                  onClick={() =>
                    setAmenities((prev) => (prev.includes(a.code) ? prev.filter((c) => c !== a.code) : Array.from(new Set([...prev, a.code]))))
                  }
                  className={`flex items-center gap-3 rounded-2xl border p-3 text-left text-sm transition-colors ${
                    on ? "border-brand bg-brand/10 text-foreground" : "border-border bg-card hover:border-brand/50"
                  }`}
                >
                  <span
                    className={`flex size-9 shrink-0 items-center justify-center rounded-xl border ${
                      on ? "border-brand/40 bg-brand/15 text-brand" : "border-border text-muted-foreground"
                    }`}
                  >
                    <AmenityIcon icon={(a as { icon?: string }).icon} className="size-4.5" />
                  </span>
                  <span className="min-w-0 flex-1 truncate">{localized(a, "name")}</span>
                  {on ? <Check className="size-4 shrink-0 text-brand" /> : null}
                </button>
              );
            })}
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

        <div className="sticky bottom-3 z-10 flex flex-wrap gap-3 rounded-2xl border border-border bg-card/95 p-3 backdrop-blur">
          <Button type="submit" disabled={saving}>{t("form.saveChanges")}</Button>
          {property.status !== "PENDING_REVIEW" && property.status !== "APPROVED" ? (
            <Button type="button" variant="outline" disabled={saving} onClick={() => void submitForReview()}>
              {t("owner.submitForReview")}
            </Button>
          ) : null}
          <Button type="button" variant="ghost" onClick={() => void toggleVisibility()}>
            {property.is_active ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
            {property.is_active ? t("owner.unpublish") : t("owner.publish")}
          </Button>
          <Button asChild type="button" variant="ghost"><Link to="/owner">{t("common.cancel")}</Link></Button>
        </div>
      </form>

      <div className="mt-8 rounded-2xl border border-destructive/40 bg-destructive/5 p-5">
        <h2 className="font-display text-lg font-semibold">{t("owner.dangerZone")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("owner.deleteConfirm")}</p>
        <Button variant="destructive" className="mt-4" onClick={() => void deleteProperty()}>
          <Trash2 className="mr-2 h-4 w-4" />
          {t("owner.deleteProperty")}
        </Button>
      </div>
    </div>
  );
}
