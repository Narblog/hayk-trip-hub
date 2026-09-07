import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InlineLoader } from "@/components/common/states";
import { supabase } from "@/integrations/supabase/client";
import { pricingQuery, savePricing, type PricingTier, type PricingType, type PropertyPricing } from "@/lib/data";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/owner/properties/$id/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — StayLand Armenia" },
      { name: "description", content: "Set a fixed nightly rate, guest-based tiers or a base price with extra-guest fees for your Armenian stay." },
      { property: "og:title", content: "Pricing — StayLand" },
      { property: "og:description", content: "Choose how your nightly price is calculated." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PricingPage,
});

const EMPTY: PropertyPricing = {
  pricing_type: "FIXED",
  fixed_price: null,
  base_price: null,
  included_guests: 2,
  extra_guest_price: null,
  currency: "AMD",
  tiers: [],
};

function PricingPage() {
  const { id } = Route.useParams();
  const { t } = useI18n();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [form, setForm] = useState<PropertyPricing>(EMPTY);

  const property = useQuery({
    queryKey: ["owner-property", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("properties").select("id, name, price_per_night, currency").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const pricing = useQuery(pricingQuery(id));

  useEffect(() => {
    if (pricing.data) setForm(pricing.data);
    else if (pricing.isFetched && property.data)
      setForm({ ...EMPTY, fixed_price: Number(property.data.price_per_night) || null, currency: property.data.currency ?? "AMD" });
  }, [pricing.data, pricing.isFetched, property.data]);

  const save = useMutation({
    mutationFn: () => savePricing(id, form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pricing", id] });
      qc.invalidateQueries({ queryKey: ["quote", id] });
      toast.success(t("price.saved"));
    },
    onError: () => toast.error(t("cal.error")),
  });

  if (!user)
    return (
      <div className="container-page py-16 text-center">
        <Button asChild><Link to="/auth">{t("nav.login")}</Link></Button>
      </div>
    );
  if (property.isPending || pricing.isPending) return <div className="container-page py-16"><InlineLoader /></div>;
  if (!property.data) return <div className="container-page py-16 text-center text-muted-foreground">{t("cal.notFound")}</div>;

  const types: { value: PricingType; label: string }[] = [
    { value: "FIXED", label: t("price.fixed") },
    { value: "TIERED", label: t("price.tiered") },
    { value: "BASE_PLUS_GUEST", label: t("price.basePlus") },
  ];

  const setTier = (i: number, patch: Partial<PricingTier>) =>
    setForm((f) => ({ ...f, tiers: f.tiers.map((tier, idx) => (idx === i ? { ...tier, ...patch } : tier)) }));

  return (
    <div className="container-page max-w-2xl py-10">
      <Link to="/owner" className="text-sm text-muted-foreground hover:text-foreground">← {t("cal.back")}</Link>
      <h1 className="mt-2 font-display text-3xl font-semibold">{t("price.title")}</h1>
      <p className="mt-1 text-muted-foreground">{property.data.name}</p>
      <p className="text-sm text-muted-foreground">{t("price.subtitle")}</p>

      <div className="mt-6 grid gap-2">
        <Label>{t("price.type")}</Label>
        <div className="grid gap-2 sm:grid-cols-3">
          {types.map((tp) => (
            <Button
              key={tp.value}
              type="button"
              variant={form.pricing_type === tp.value ? "default" : "outline"}
              className="h-auto min-h-14 whitespace-normal text-sm"
              onClick={() => setForm((f) => ({ ...f, pricing_type: tp.value }))}
            >
              {tp.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="mt-6 space-y-4 rounded-2xl border border-border bg-card p-5">
        {form.pricing_type === "FIXED" ? (
          <div className="grid gap-2">
            <Label htmlFor="fixed">{t("price.fixedPrice")}</Label>
            <Input id="fixed" type="number" min={0} value={form.fixed_price ?? ""} onChange={(e) => setForm((f) => ({ ...f, fixed_price: e.target.value ? Number(e.target.value) : null }))} />
          </div>
        ) : null}

        {form.pricing_type === "BASE_PLUS_GUEST" ? (
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="base">{t("price.basePrice")}</Label>
              <Input id="base" type="number" min={0} value={form.base_price ?? ""} onChange={(e) => setForm((f) => ({ ...f, base_price: e.target.value ? Number(e.target.value) : null }))} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="inc">{t("price.includedGuests")}</Label>
              <Input id="inc" type="number" min={1} value={form.included_guests} onChange={(e) => setForm((f) => ({ ...f, included_guests: Math.max(1, Number(e.target.value) || 1) }))} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="extra">{t("price.extraGuest")}</Label>
              <Input id="extra" type="number" min={0} value={form.extra_guest_price ?? ""} onChange={(e) => setForm((f) => ({ ...f, extra_guest_price: e.target.value ? Number(e.target.value) : null }))} />
            </div>
          </div>
        ) : null}

        {form.pricing_type === "TIERED" ? (
          <div className="grid gap-3">
            <Label>{t("price.tiers")}</Label>
            {form.tiers.map((tier, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_1.4fr_auto] items-end gap-2">
                <div className="grid gap-1">
                  <span className="text-xs text-muted-foreground">{t("price.minGuests")}</span>
                  <Input type="number" min={1} value={tier.min_guests} onChange={(e) => setTier(i, { min_guests: Number(e.target.value) || 1 })} />
                </div>
                <div className="grid gap-1">
                  <span className="text-xs text-muted-foreground">{t("price.maxGuests")}</span>
                  <Input type="number" min={1} value={tier.max_guests} onChange={(e) => setTier(i, { max_guests: Number(e.target.value) || 1 })} />
                </div>
                <div className="grid gap-1">
                  <span className="text-xs text-muted-foreground">{t("price.perNight")}</span>
                  <Input type="number" min={0} value={tier.price_per_night} onChange={(e) => setTier(i, { price_per_night: Number(e.target.value) || 0 })} />
                </div>
                <Button type="button" variant="ghost" size="icon" aria-label={t("price.removeTier")} onClick={() => setForm((f) => ({ ...f, tiers: f.tiers.filter((_, idx) => idx !== i) }))}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setForm((f) => {
                  const last = f.tiers[f.tiers.length - 1];
                  const min = last ? last.max_guests + 1 : 1;
                  return { ...f, tiers: [...f.tiers, { min_guests: min, max_guests: min + 1, price_per_night: 0, sort_order: f.tiers.length }] };
                })
              }
            >
              {t("price.addTier")}
            </Button>
          </div>
        ) : null}

        <div className="grid max-w-40 gap-2">
          <Label htmlFor="cur">{t("price.currency")}</Label>
          <Input id="cur" value={form.currency} onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value.toUpperCase().slice(0, 3) }))} />
        </div>
      </div>

      <Button className="mt-6 h-12 w-full rounded-full sm:w-auto sm:px-10" disabled={save.isPending} onClick={() => save.mutate()}>
        {save.isPending ? t("cal.saving") : t("price.save")}
      </Button>
    </div>
  );
}
