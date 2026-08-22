import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { ImagePlus, Star, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { InlineLoader } from "@/components/common/states";
import { LocationField } from "@/components/property/LocationField";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { refDataQuery } from "@/lib/data";
import { slugify } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/owner/tours/new")({
  head: () => ({
    meta: [
      { title: "Add a tour in Armenia — StayLand" },
      {
        name: "description",
        content: "Submit your guided tour or experience in Armenia for review and reach travellers on StayLand.",
      },
      { property: "og:title", content: "Add a tour — StayLand" },
      { property: "og:description", content: "Publish your Armenian tour or experience." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NewTourPage,
});

function NewTourPage() {
  const { t, localized } = useI18n();
  const { user, isOwner } = useAuth();
  const navigate = useNavigate();
  const { data: ref, isPending } = useQuery(refDataQuery());
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photos, setPhotos] = useState<{ url: string; path: string }[]>([]);
  const [mainPhoto, setMainPhoto] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [coords, setCoords] = useState<{ lat: number | null; lng: number | null }>({ lat: null, lng: null });
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    name: "",
    category: "",
    description: "",
    region_code: "",
    city_code: "",
    location: "",
    meeting_point: "",
    price: "",
    duration_hours: "3",
    max_participants: "10",
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
    if (!form.name.trim()) e['name'] = t("tourForm.errName");
    if (!form.category) e['category'] = t("tourForm.errCategory");
    if (!form.price || Number(form.price) <= 0) e['price'] = t("tourForm.errPrice");
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

  const cities = (ref?.cities ?? []).filter((c) => !form.region_code || c.region_code === form.region_code);

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
        .from("tours")
        .insert({
          owner_id: user.id,
          name: form.name.trim(),
          slug: `${slugify(form.name)}-${Math.random().toString(36).slice(2, 8)}`,
          description: form.description || null,
          category: form.category,
          city_code: form.city_code || null,
          region_code: form.region_code || city?.region_code || null,
          location: form.location || null,
          meeting_point: form.meeting_point || null,
          latitude: coords.lat,
          longitude: coords.lng,
          price: Number(form.price),
          duration_hours: form.duration_hours ? Number(form.duration_hours) : null,
          max_participants: Number(form.max_participants) || 1,
          main_image_url: mainPhoto || null,
          contact_phone: form.contact_phone || null,
          contact_whatsapp: form.contact_whatsapp || null,
          contact_instagram: form.contact_instagram || null,
          status,
        })
        .select("id")
        .single();
      if (error) throw error;
      if (photos.length && data) {
        const { error: imgErr } = await supabase.from("tour_images").insert(
          photos.map((ph, i) => ({
            tour_id: data.id,
            image_url: ph.url,
            storage_path: ph.path,
            sort_order: i,
            is_cover: ph.url === (mainPhoto || photos[0]?.url),
          })),
        );
        if (imgErr) throw imgErr;
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
        <h1 className="font-display text-3xl font-semibold">{t("tourForm.title")}</h1>
        <p className="mt-3 text-muted-foreground">{t("tourForm.subtitle")}</p>
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
      <h1 className="font-display text-3xl font-semibold">{t("tourForm.title")}</h1>
      <p className="mt-2 text-muted-foreground">{t("tourForm.subtitle")}</p>

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
              <Label htmlFor="t-name">{t("tourForm.name")} *</Label>
              <Input
                id="t-name"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                aria-invalid={!!errors['name']}
                className={errors['name'] ? errCls : undefined}
              />
              <FieldError id="name" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="t-cat">{t("tourForm.category")} *</Label>
              <select
                id="t-cat"
                className={`${selectCls} ${errors['category'] ? errCls : ""}`}
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
              >
                <option value="">{t("form.select")}</option>
                {(ref?.categories ?? []).map((c) => (
                  <option key={c.code} value={c.code}>
                    {localized(c, "name")}
                  </option>
                ))}
              </select>
              <FieldError id="category" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="t-desc">{t("tourForm.description")}</Label>
            <Textarea id="t-desc" rows={4} value={form.description} onChange={(e) => set("description", e.target.value)} />
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
          <Button type="button" variant="outline" disabled={uploading} onClick={() => fileRef.current?.click()}>
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
                      <img src={ph.url} alt={form.name || "tour"} className="h-full w-full object-cover" />
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
              <Label htmlFor="t-region">{t("form.region")}</Label>
              <select
                id="t-region"
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
              <Label htmlFor="t-city">{t("form.city")}</Label>
              <select id="t-city" className={selectCls} value={form.city_code} onChange={(e) => set("city_code", e.target.value)}>
                <option value="">{t("form.select")}</option>
                {cities.map((c) => (
                  <option key={c.code} value={c.code}>
                    {localized(c, "name")}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="t-loc">{t("tourForm.location")}</Label>
              <Input id="t-loc" value={form.location} onChange={(e) => set("location", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="t-meet">{t("tourForm.meetingPoint")}</Label>
              <Input id="t-meet" value={form.meeting_point} onChange={(e) => set("meeting_point", e.target.value)} />
            </div>
          </div>
          <LocationField lat={coords.lat} lng={coords.lng} onChange={(lat, lng) => setCoords({ lat, lng })} />
        </div>

        <div className={section}>
          <h2 className="font-display text-lg font-semibold">{t("form.capacity")}</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="t-price">{t("tourForm.price")} *</Label>
              <Input
                id="t-price"
                type="number"
                min={0}
                value={form.price}
                onChange={(e) => set("price", e.target.value)}
                aria-invalid={!!errors['price']}
                className={errors['price'] ? errCls : undefined}
              />
              <FieldError id="price" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="t-dur">{t("tourForm.duration")}</Label>
              <Input id="t-dur" type="number" min={0} step="0.5" value={form.duration_hours} onChange={(e) => set("duration_hours", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="t-max">{t("tourForm.maxParticipants")}</Label>
              <Input id="t-max" type="number" min={1} value={form.max_participants} onChange={(e) => set("max_participants", e.target.value)} />
            </div>
          </div>
        </div>

        <div className={section}>
          <h2 className="font-display text-lg font-semibold">{t("form.contact")}</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="t-phone">{t("form.phone")}</Label>
              <Input id="t-phone" value={form.contact_phone} onChange={(e) => set("contact_phone", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="t-wa">{t("form.whatsapp")}</Label>
              <Input id="t-wa" value={form.contact_whatsapp} onChange={(e) => set("contact_whatsapp", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="t-ig">{t("form.instagram")}</Label>
              <Input id="t-ig" value={form.contact_instagram} onChange={(e) => set("contact_instagram", e.target.value)} />
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
