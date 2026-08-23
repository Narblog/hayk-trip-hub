import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/common/StatusBadge";
import { EmptyState } from "@/components/common/states";
import { useAuth } from "@/lib/auth";
import {
  adminDeleteProperty,
  adminDeleteTour,
  adminPropertiesQuery,
  adminSetStatus,
  adminSetTourStatus,
  adminStatsQuery,
  adminToursQuery,
  adminUpdateProperty,
  type ListingStatus,
} from "@/lib/data";
import { formatPrice } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Admin — StayLand Armenia" },
      { name: "description", content: "Moderate listings, owners and tours across the StayLand Armenia platform." },
      { property: "og:title", content: "Admin — StayLand" },
      { property: "og:description", content: "Platform moderation overview." },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { t, lang } = useI18n();
  const { isAdmin, user } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState<string>("PENDING_REVIEW");
  const [editing, setEditing] = useState<any | null>(null);
  const [section, setSection] = useState<"properties" | "tours">("properties");
  const { data } = useQuery({ ...adminStatsQuery(), enabled: isAdmin });
  const list = useQuery({ ...adminPropertiesQuery(tab), enabled: isAdmin && section === "properties" });
  const tourList = useQuery({ ...adminToursQuery(tab), enabled: isAdmin && section === "tours" });

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["admin-properties"] });
    void qc.invalidateQueries({ queryKey: ["admin-tours"] });
    void qc.invalidateQueries({ queryKey: ["owner-tours"] });
    void qc.invalidateQueries({ queryKey: ["tours-list"] });
    void qc.invalidateQueries({ queryKey: ["admin-stats"] });
    void qc.invalidateQueries({ queryKey: ["search"] });
    void qc.invalidateQueries({ queryKey: ["collection"] });
  };

  const setTourStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ListingStatus }) =>
      adminSetTourStatus(user!.id, id, status),
    onSuccess: () => {
      toast.success(t("common.save"));
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeTour = useMutation({
    mutationFn: (id: string) => adminDeleteTour(user!.id, id),
    onSuccess: () => {
      toast.success(t("common.delete"));
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ListingStatus }) =>
      adminSetStatus(user!.id, id, status),
    onSuccess: () => {
      toast.success(t("common.save"));
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => adminDeleteProperty(user!.id, id),
    onSuccess: () => {
      toast.success(t("common.delete"));
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const save = useMutation({
    mutationFn: (p: { id: string; patch: Record<string, unknown> }) =>
      adminUpdateProperty(user!.id, p.id, p.patch),
    onSuccess: () => {
      toast.success(t("common.save"));
      setEditing(null);
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!isAdmin)
    return <div className="container-page py-16 text-center text-muted-foreground">{t("error.title")}</div>;

  return (
    <div className="container-page py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-semibold">{t("admin.overview")}</h1>
        <Button asChild variant="outline" size="sm">
          <Link to="/admin/cities">{t("admin.manageCities")}</Link>
        </Button>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          [t("admin.totalUsers"), data?.users ?? 0],
          [t("admin.totalProperties"), data?.properties ?? 0],
          [t("admin.pending"), data?.pending ?? 0],
          [t("admin.totalTours"), data?.tours ?? 0],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-2xl border border-border bg-card p-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className="mt-1 font-display text-2xl font-semibold">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 flex flex-wrap gap-2">
        {[
          ["PENDING_REVIEW", t("admin.pending")],
          ["APPROVED", t("admin.approved")],
          ["DRAFT", t("status.DRAFT")],
          ["REJECTED", t("admin.rejected")],
          ["SUSPENDED", t("admin.suspended")],
          ["ALL", t("common.all")],
        ].map(([k, label]) => (
          <button
            key={k as string}
            type="button"
            onClick={() => setTab(k as string)}
            className={`rounded-full border px-4 py-1.5 text-xs font-medium ${
              tab === k ? "border-brand bg-brand-soft text-brand" : "border-border hover:bg-surface"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-3">
        {list.isPending ? (
          <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
        ) : (list.data?.length ?? 0) === 0 ? (
          <EmptyState title={t("empty.noResults")} />
        ) : (
          list.data!.map((p: any) => (
            <div
              key={p.id}
              className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4"
            >
              <div className="min-w-[220px] flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-display text-lg font-semibold">{p.name}</p>
                  <StatusBadge status={p.status} />
                </div>
                <p className="text-xs text-muted-foreground">
                  {p.city_code ?? "—"} · {formatPrice(Number(p.price_per_night), p.currency ?? "AMD", lang)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild size="sm" variant="ghost">
                  <Link to="/property/$slug" params={{ slug: p.slug }}>
                    {t("admin.review")}
                  </Link>
                </Button>
                {p.status !== "APPROVED" ? (
                  <Button
                    size="sm"
                    onClick={() => setStatus.mutate({ id: p.id, status: "APPROVED" })}
                  >
                    {t("admin.approve")}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setStatus.mutate({ id: p.id, status: "SUSPENDED" })}
                  >
                    {t("admin.suspend")}
                  </Button>
                )}
                {p.status !== "REJECTED" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setStatus.mutate({ id: p.id, status: "REJECTED" })}
                  >
                    {t("admin.reject")}
                  </Button>
                ) : null}
                <Button size="sm" variant="outline" onClick={() => setEditing(p)}>
                  {t("admin.edit")}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    if (confirm(`${t("common.delete")}: ${p.name}?`)) remove.mutate(p.id);
                  }}
                >
                  {t("common.delete")}
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing?.name}</DialogTitle>
          </DialogHeader>
          {editing ? (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="a-name">{t("form.name")}</Label>
                <Input
                  id="a-name"
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="a-price">{t("form.price")}</Label>
                  <Input
                    id="a-price"
                    type="number"
                    value={editing.price_per_night}
                    onChange={(e) => setEditing({ ...editing, price_per_night: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="a-guests">{t("form.maxGuests")}</Label>
                  <Input
                    id="a-guests"
                    type="number"
                    value={editing.max_guests}
                    onChange={(e) => setEditing({ ...editing, max_guests: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-border px-3 py-2">
                <Label htmlFor="a-active">{t("admin.activateUser")}</Label>
                <Switch
                  id="a-active"
                  checked={!!editing.is_active}
                  onCheckedChange={(v) => setEditing({ ...editing, is_active: v })}
                />
              </div>
              <div className="flex items-center justify-between rounded-xl border border-border px-3 py-2">
                <Label htmlFor="a-featured">{t("home.featured")}</Label>
                <Switch
                  id="a-featured"
                  checked={!!editing.is_featured}
                  onCheckedChange={(v) => setEditing({ ...editing, is_featured: v })}
                />
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={() =>
                save.mutate({
                  id: editing.id,
                  patch: {
                    name: editing.name,
                    price_per_night: Number(editing.price_per_night),
                    max_guests: Number(editing.max_guests),
                    is_active: !!editing.is_active,
                    is_featured: !!editing.is_featured,
                  },
                })
              }
            >
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
