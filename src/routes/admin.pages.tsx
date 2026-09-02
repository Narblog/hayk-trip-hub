import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/common/states";
import { useAuth } from "@/lib/auth";
import { adminDeletePage, adminPagesQuery, adminSavePage, type PageInput } from "@/lib/data";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/admin/pages")({
  head: () => ({
    meta: [
      { title: "Pages — StayLand Armenia admin" },
      { name: "description", content: "Create and edit StayLand Armenia content pages in Armenian, Russian and English." },
      { property: "og:title", content: "Pages — StayLand admin" },
      { property: "og:description", content: "Manage the content pages shown across StayLand Armenia." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPagesPage,
});

const empty: PageInput = {
  slug: "",
  title_en: "",
  title_hy: "",
  title_ru: "",
  content_en: "",
  content_hy: "",
  content_ru: "",
  seo_description_en: "",
  seo_description_hy: "",
  seo_description_ru: "",
  show_in_footer: true,
  sort_order: 100,
  is_published: true,
};

function AdminPagesPage() {
  const { t, localized } = useI18n();
  const { isAdmin, user } = useAuth();
  const qc = useQueryClient();
  const [form, setForm] = useState<PageInput>(empty);

  const pages = useQuery({ ...adminPagesQuery(), enabled: isAdmin });

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["admin-pages"] });
    void qc.invalidateQueries({ queryKey: ["footer-pages"] });
    void qc.invalidateQueries({ queryKey: ["page"] });
  };

  const save = useMutation({
    mutationFn: (p: PageInput) => adminSavePage(user!.id, p),
    onSuccess: () => {
      toast.success(t("cms.saved"));
      setForm(empty);
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (p: { id: string; slug: string }) => adminDeletePage(user!.id, p.id, p.slug),
    onSuccess: () => {
      toast.success(t("cms.deleted"));
      setForm(empty);
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!isAdmin)
    return <div className="container-page py-16 text-center text-muted-foreground">{t("error.title")}</div>;

  const submit = () => {
    if (!form.slug.trim()) {
      toast.error(t("cms.errSlug"));
      return;
    }
    if (!form.title_hy.trim() || !form.title_en.trim() || !form.title_ru.trim()) {
      toast.error(t("cms.errTitle"));
      return;
    }
    save.mutate(form);
  };

  return (
    <div className="container-page py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold">{t("cms.manage")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("cms.subtitle")}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setForm(empty)}>
            {t("cms.newPage")}
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link to="/admin">{t("admin.overview")}</Link>
          </Button>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4 rounded-3xl border border-border bg-card p-6 shadow-card">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="p-slug">{t("cms.slug")}</Label>
              <Input
                id="p-slug"
                value={form.slug}
                placeholder="about-stayland"
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">{t("cms.slugHint")}</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-sort">{t("cms.sortOrder")}</Label>
              <Input
                id="p-sort"
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
              />
            </div>
          </div>

          {(
            [
              ["hy", t("cms.titleHy"), t("cms.contentHy")],
              ["en", t("cms.titleEn"), t("cms.contentEn")],
              ["ru", t("cms.titleRu"), t("cms.contentRu")],
            ] as const
          ).map(([code, titleLabel, contentLabel]) => (
            <div key={code} className="space-y-3 rounded-2xl border border-border/70 p-4">
              <div className="space-y-1.5">
                <Label htmlFor={`p-title-${code}`}>{titleLabel}</Label>
                <Input
                  id={`p-title-${code}`}
                  value={(form as unknown as Record<string, string>)[`title_${code}`] ?? ""}
                  onChange={(e) => setForm({ ...form, [`title_${code}`]: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`p-content-${code}`}>{contentLabel}</Label>
                <Textarea
                  id={`p-content-${code}`}
                  rows={7}
                  value={(form as unknown as Record<string, string>)[`content_${code}`] ?? ""}
                  onChange={(e) => setForm({ ...form, [`content_${code}`]: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">{t("cms.contentHint")}</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`p-seo-${code}`}>{t("cms.seo")}</Label>
                <Input
                  id={`p-seo-${code}`}
                  value={(form as unknown as Record<string, string | null>)[`seo_description_${code}`] ?? ""}
                  onChange={(e) => setForm({ ...form, [`seo_description_${code}`]: e.target.value })}
                />
              </div>
            </div>
          ))}

          <div className="flex items-center justify-between rounded-xl border border-border px-3 py-2">
            <Label htmlFor="p-pub">{t("cms.published")}</Label>
            <Switch
              id="p-pub"
              checked={form.is_published}
              onCheckedChange={(v) => setForm({ ...form, is_published: v })}
            />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-border px-3 py-2">
            <Label htmlFor="p-footer">{t("cms.showInFooter")}</Label>
            <Switch
              id="p-footer"
              checked={form.show_in_footer}
              onCheckedChange={(v) => setForm({ ...form, show_in_footer: v })}
            />
          </div>

          <Button onClick={submit} disabled={save.isPending}>
            {t("common.save")}
          </Button>
        </div>

        <div className="space-y-3">
          {pages.isPending ? (
            <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
          ) : (pages.data?.length ?? 0) === 0 ? (
            <EmptyState title={t("cms.noPages")} />
          ) : (
            pages.data!.map((p) => (
              <div key={p.id} className="rounded-2xl border border-border bg-card p-4">
                <p className="font-display text-lg font-semibold">{localized(p, "title")}</p>
                <p className="text-xs text-muted-foreground">
                  /p/{p.slug} · {p.is_published ? t("cms.published") : "—"}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => setForm({ ...p })}>
                    {t("admin.edit")}
                  </Button>
                  <Button asChild size="sm" variant="ghost">
                    <Link to="/p/$slug" params={{ slug: p.slug }}>
                      {t("cms.view")}
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      if (confirm(`${t("common.delete")}: ${p.slug}?`)) remove.mutate({ id: p.id, slug: p.slug });
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
    </div>
  );
}
