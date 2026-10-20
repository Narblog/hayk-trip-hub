import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ImagePlus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { formatPrice } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { processImage } from "@/lib/images";
import {
  PACKAGE_ICONS,
  adminPackagesQuery,
  deletePackage,
  packageNights,
  packagePropertyOptionsQuery,
  savePackage,
  type PackageInput,
} from "@/lib/packages";

export const Route = createFileRoute("/admin/packages")({
  head: () => ({
    meta: [
      { title: "Փաթեթներ — StayLand ադմին" },
      { name: "description", content: "Ավելացնել և խմբագրել ամանորյա ու տոնական փաթեթները։" },
      { property: "og:title", content: "Փաթեթներ — StayLand ադմին" },
      { property: "og:description", content: "Տոնական փաթեթների կառավարում։" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPackagesPage,
});

const empty: PackageInput = {
  title: "",
  description: "",
  icon: "tree",
  property_id: null,
  check_in: "",
  check_out: "",
  price: 0,
  currency: "AMD",
  includes: [],
  image_url: null,
  is_active: true,
  sort_order: 0,
};

function AdminPackagesPage() {
  const { lang } = useI18n();
  const { isAdmin, user } = useAuth();
  const qc = useQueryClient();
  const list = useQuery({ ...adminPackagesQuery(), enabled: isAdmin });
  const props = useQuery({ ...packagePropertyOptionsQuery(), enabled: isAdmin });
  const [form, setForm] = useState<PackageInput>(empty);
  const [includesText, setIncludesText] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setForm(empty);
    setIncludesText("");
    setEditId(null);
  };
  const refresh = () => void qc.invalidateQueries({ queryKey: ["packages"] });

  const save = useMutation({
    mutationFn: () =>
      savePackage(editId, {
        ...form,
        includes: includesText.split("\n").map((s) => s.trim()).filter(Boolean),
      }),
    onSuccess: () => {
      toast.success("Պահպանված է");
      reset();
      refresh();
    },
    onError: (e: Error) =>
      toast.error(e.message === "check_out" ? "Մեկնման օրը պետք է լինի ժամանումից հետո" : e.message),
  });

  const remove = useMutation({
    mutationFn: deletePackage,
    onSuccess: () => {
      toast.success("Ջնջված է");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function upload(file: File | undefined) {
    if (!file || !user) return;
    setUploading(true);
    try {
      const { blob, path, contentType } = await processImage(file, user.id, { prefix: "packages" });
      const { error } = await supabase.storage.from("property-images").upload(path, blob, { contentType, upsert: false });
      if (error) throw error;
      const { data, error: e2 } = await supabase.storage.from("property-images").createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
      if (e2 || !data) throw e2 ?? new Error("sign failed");
      setForm((f) => ({ ...f, image_url: data.signedUrl }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  if (!isAdmin) return <div className="container-page py-16 text-center text-muted-foreground">Հասանելի չէ</div>;

  const canSave = form.title.trim() && form.check_in && form.check_out && form.property_id;

  return (
    <div className="container-page py-8 sm:py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold sm:text-3xl">Փաթեթներ</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm"><Link to="/packages">Դիտել էջը</Link></Button>
          <Button asChild variant="outline" size="sm"><Link to="/admin">Ադմին</Link></Button>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
        <div className="h-fit space-y-4 rounded-2xl border border-border bg-card p-4 sm:p-5">
          <h2 className="font-semibold">{editId ? "Խմբագրել փաթեթը" : "Նոր փաթեթ"}</h2>

          <div className="space-y-1.5">
            <Label>Անվանում</Label>
            <Input value={form.title} placeholder="Ամանոր Դիլիջանում" onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>

          <div className="space-y-1.5">
            <Label>Պատկերակ</Label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(PACKAGE_ICONS).map(([key, Icon]) => (
                <button
                  key={key}
                  type="button"
                  aria-label={key}
                  onClick={() => setForm({ ...form, icon: key })}
                  className={`grid size-10 place-items-center rounded-full border transition ${form.icon === key ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-secondary"}`}
                >
                  <Icon className="size-5" />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Հյուրատուն</Label>
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={form.property_id ?? ""}
              onChange={(e) => setForm({ ...form, property_id: e.target.value || null })}
            >
              <option value="">— Ընտրել —</option>
              {props.data?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Ժամանում</Label>
              <DatePicker value={form.check_in} onChange={(v: string) => setForm({ ...form, check_in: v })} />
            </div>
            <div className="space-y-1.5">
              <Label>Մեկնում</Label>
              <DatePicker value={form.check_out} onChange={(v: string) => setForm({ ...form, check_out: v })} />
            </div>
          </div>
          {form.check_in && form.check_out ? (
            <p className="text-xs text-muted-foreground">{packageNights(form)} գիշեր</p>
          ) : null}

          <div className="grid grid-cols-[minmax(0,1fr)_6rem] gap-3">
            <div className="space-y-1.5">
              <Label>Փաթեթի գին</Label>
              <Input type="number" min={0} value={form.price || ""} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
            </div>
            <div className="space-y-1.5">
              <Label>Արժույթ</Label>
              <select className="h-10 w-full rounded-md border border-input bg-background px-2 text-sm" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
                <option>AMD</option><option>USD</option><option>EUR</option><option>RUB</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Նկարագրություն</Label>
            <Textarea rows={3} value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>

          <div className="space-y-1.5">
            <Label>Ինչ է ներառված (ամեն տողում մեկը)</Label>
            <Textarea rows={4} value={includesText} placeholder={"Տոնական ընթրիք\nՆախաճաշ\nՀրավառություն"} onChange={(e) => setIncludesText(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label>Նկար (եթե չկա՝ կօգտագործվի հյուրատան նկարը)</Label>
            <div className="flex items-center gap-3">
              {form.image_url ? <img src={form.image_url} alt="" className="h-14 w-20 rounded-md object-cover" /> : null}
              <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => fileRef.current?.click()}>
                <ImagePlus className="size-4" /> {uploading ? "..." : "Վերբեռնել"}
              </Button>
              {form.image_url ? <Button type="button" variant="ghost" size="sm" onClick={() => setForm({ ...form, image_url: null })}>Հեռացնել</Button> : null}
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => void upload(e.target.files?.[0])} />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="pk-active">Ցուցադրել կայքում</Label>
            <Switch id="pk-active" checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
          </div>

          <div className="flex justify-end gap-2">
            {editId ? <Button variant="ghost" onClick={reset}>Չեղարկել</Button> : null}
            <Button disabled={!canSave || save.isPending} onClick={() => save.mutate()}>Պահպանել</Button>
          </div>
        </div>

        <div className="space-y-3">
          {list.data?.length === 0 ? <p className="text-sm text-muted-foreground">Դեռ փաթեթներ չկան։</p> : null}
          {list.data?.map((p) => {
            const Icon = PACKAGE_ICONS[p.icon] ?? PACKAGE_ICONS.tree;
            return (
              <div key={p.id} className="flex min-w-0 items-center gap-3 rounded-2xl border border-border bg-card p-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground"><Icon className="size-5" /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{p.title} {!p.is_active ? <span className="text-xs text-muted-foreground">(թաքնված)</span> : null}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {p.property?.name ?? "—"} · {p.check_in} → {p.check_out} · {formatPrice(Number(p.price), p.currency, lang)}
                  </p>
                </div>
                <Button size="icon" variant="ghost" aria-label="Խմբագրել" onClick={() => {
                  const { id, property, ...rest } = p;
                  void property;
                  setEditId(id);
                  setForm({ ...rest, price: Number(rest.price) });
                  setIncludesText(rest.includes.join("\n"));
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}><Pencil className="size-4" /></Button>
                <Button size="icon" variant="ghost" aria-label="Ջնջել" onClick={() => { if (confirm("Ջնջե՞լ փաթեթը")) remove.mutate(p.id); }}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
