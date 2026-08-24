import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { EmptyState } from "@/components/common/states";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { adminCitiesQuery, adminDeleteCity, adminUpsertCity, refDataQuery, type CityInput } from "@/lib/data";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/admin/cities")({
  head: () => ({
    meta: [
      { title: "Cities — StayLand Armenia admin" },
      { name: "description", content: "Add and update Armenian cities available to hosts when listing a stay." },
      { property: "og:title", content: "Cities — StayLand admin" },
      { property: "og:description", content: "Manage the city list used across StayLand Armenia listings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminCitiesPage,
});

const empty: CityInput = {
  code: "",
  region_code: "",
  name_hy: "",
  name_en: "",
  name_ru: "",
  is_popular: false,
  sort_order: 100,
  image_url: null,
};

function AdminCitiesPage() {
  const { t, localized } = useI18n();
  const { isAdmin, user } = useAuth();
  const qc = useQueryClient();
  const [form, setForm] = useState<CityInput>(empty);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function uploadImage(file: File | undefined) {
    if (!file || !user) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `cities/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from("property-images")
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (error) throw error;
      const { data: signed, error: signErr } = await supabase.storage
        .from("property-images")
        .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
      if (signErr || !signed) throw signErr ?? new Error("sign failed");
      setForm((f) => ({ ...f, image_url: signed.signedUrl }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }
  const { data: ref } = useQuery(refDataQuery());
  const cities = useQuery({ ...adminCitiesQuery(), enabled: isAdmin });

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["admin-cities"] });
    void qc.invalidateQueries({ queryKey: ["ref-data"] });
    void qc.invalidateQueries({ queryKey: ["collection"] });
  };

  const save = useMutation({
    mutationFn: (c: CityInput) => adminUpsertCity(user!.id, c),
    onSuccess: () => {
      toast.success(t("admin.citySaved"));
      setForm(empty);
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (code: string) => adminDeleteCity(user!.id, code),
    onSuccess: () => {
      toast.success(t("common.delete"));
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!isAdmin)
    return <div className="container-page py-16 text-center text-muted-foreground">{t("error.title")}</div>;

  const regions = ref?.regions ?? [];
  const canSave =
    form.code.trim() && form.region_code && form.name_hy.trim() && form.name_en.trim() && form.name_ru.trim();

  return (
    <div className="container-page py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-semibold">{t("admin.cities")}</h1>
        <Button asChild variant="outline" size="sm">
          <Link to="/admin">{t("admin.overview")}</Link>
        </Button>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card p-5">
        <h2 className="font-display text-xl font-semibold">{t("admin.addCity")}</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="c-code">{t("admin.cityCode")}</Label>
            <Input
              id="c-code"
              value={form.code}
              placeholder="dilijan"
              onChange={(e) => setForm({ ...form, code: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-region">{t("admin.cityRegion")}</Label>
            <select
              id="c-region"
              value={form.region_code}
              onChange={(e) => setForm({ ...form, region_code: e.target.value })}
              className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
            >
              <option value="">{t("form.select")}</option>
              {regions.map((r: any) => (
                <option key={r.code} value={r.code}>
                  {localized(r, "name")}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-sort">{t("admin.citySort")}</Label>
            <Input
              id="c-sort"
              type="number"
              value={form.sort_order ?? 100}
              onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-hy">Հայերեն</Label>
            <Input id="c-hy" value={form.name_hy} onChange={(e) => setForm({ ...form, name_hy: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-en">English</Label>
            <Input id="c-en" value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-ru">Русский</Label>
            <Input id="c-ru" value={form.name_ru} onChange={(e) => setForm({ ...form, name_ru: e.target.value })} />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4">
          <div className="relative size-24 shrink-0 overflow-hidden rounded-xl border border-border bg-surface">
            {form.image_url ? (
              <>
                <img src={form.image_url} alt="" className="size-full object-cover" />
                <button
                  type="button"
                  aria-label={t("common.delete")}
                  onClick={() => setForm({ ...form, image_url: null })}
                  className="absolute right-1 top-1 rounded-full bg-card/90 p-1"
                >
                  <X className="size-3.5" />
                </button>
              </>
            ) : (
              <div className="flex size-full items-center justify-center text-muted-foreground">
                <ImagePlus className="size-6" />
              </div>
            )}
          </div>
          <div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => void uploadImage(e.target.files?.[0])}
            />
            <Button variant="outline" size="sm" disabled={uploading} onClick={() => fileRef.current?.click()}>
              {uploading ? t("common.loading") : t("form.uploadPhotos")}
            </Button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 rounded-xl border border-border px-3 py-2">
            <Label htmlFor="c-pop">{t("admin.cityPopular")}</Label>
            <Switch
              id="c-pop"
              checked={!!form.is_popular}
              onCheckedChange={(v) => setForm({ ...form, is_popular: v })}
            />
          </div>
          <Button disabled={!canSave || save.isPending} onClick={() => save.mutate(form)}>
            {t("common.save")}
          </Button>
        </div>
      </div>

      <div className="mt-8 space-y-2">
        {cities.isPending ? (
          <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
        ) : (cities.data?.length ?? 0) === 0 ? (
          <EmptyState title={t("empty.noResults")} />
        ) : (
          cities.data!.map((c: any) => (
            <div
              key={c.code}
              className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4"
            >
              {c.image_url ? (
                <img
                  src={c.image_url}
                  alt={localized(c, "name")}
                  loading="lazy"
                  className="size-14 shrink-0 rounded-xl object-cover"
                />
              ) : (
                <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-surface text-muted-foreground">
                  <ImagePlus className="size-5" />
                </div>
              )}
              <div className="min-w-[220px] flex-1">
                <p className="font-display text-lg font-semibold">
                  {localized(c, "name")}{" "}
                  {c.is_popular ? (
                    <span className="ml-1 rounded-full bg-brand-soft px-2 py-0.5 text-[0.625rem] text-accent-foreground">
                      ★
                    </span>
                  ) : null}
                </p>
                <p className="text-xs text-muted-foreground">
                  {c.code} · {c.region_code} · {c.name_en} / {c.name_ru}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setForm({
                      code: c.code,
                      region_code: c.region_code,
                      name_hy: c.name_hy,
                      name_en: c.name_en,
                      name_ru: c.name_ru,
                      is_popular: !!c.is_popular,
                      sort_order: c.sort_order ?? 100,
                    })
                  }
                >
                  {t("admin.edit")}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => save.mutate({ ...c, is_popular: !c.is_popular })}
                >
                  {t("admin.cityPopular")}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    if (confirm(`${t("common.delete")}: ${c.name_hy}?`)) remove.mutate(c.code);
                  }}
                >
                  {t("common.delete")}
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
