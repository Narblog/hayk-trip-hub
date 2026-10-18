import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ExternalLink, Facebook, Instagram, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { adminSaveSocialLinks, socialLinksQuery, type SocialLinks } from "@/lib/data";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/admin/social")({
  head: () => ({
    meta: [
      { title: "Social links — StayLand Armenia admin" },
      {
        name: "description",
        content: "Set the Instagram, Facebook and Telegram page addresses used by the site footer.",
      },
      { property: "og:title", content: "Social links — StayLand admin" },
      { property: "og:description", content: "Manage the social page links shown in the StayLand footer." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminSocialPage,
});

const empty: SocialLinks = { instagram: "", facebook: "", telegram: "" };

const fields = [
  { key: "instagram", label: "Instagram", icon: Instagram, placeholder: "instagram.com/stayland" },
  { key: "facebook", label: "Facebook", icon: Facebook, placeholder: "facebook.com/stayland" },
  { key: "telegram", label: "Telegram", icon: Send, placeholder: "t.me/stayland" },
] as const;

function AdminSocialPage() {
  const { t } = useI18n();
  const { isAdmin, user } = useAuth();
  const qc = useQueryClient();
  const links = useQuery({ ...socialLinksQuery(), enabled: isAdmin });
  const [form, setForm] = useState<SocialLinks>(empty);
  const [filled, setFilled] = useState(false);

  // Load the saved addresses once they arrive, without clobbering what the
  // admin is currently typing.
  useEffect(() => {
    if (links.data && !filled) {
      setForm(links.data);
      setFilled(true);
    }
  }, [links.data, filled]);

  const save = useMutation({
    mutationFn: (value: SocialLinks) => adminSaveSocialLinks(user!.id, value),
    onSuccess: (value) => {
      setForm(value);
      toast.success(t("admin.socialSaved"));
      void qc.invalidateQueries({ queryKey: ["platform-settings", "social_links"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!isAdmin)
    return <div className="container-page py-16 text-center text-muted-foreground">{t("error.title")}</div>;

  return (
    <div className="container-page py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-semibold">{t("admin.socialTitle")}</h1>
        <Button asChild variant="outline" size="sm">
          <Link to="/admin">{t("admin.overview")}</Link>
        </Button>
      </div>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{t("admin.socialSub")}</p>

      <div className="mt-6 max-w-xl rounded-2xl border border-border bg-card p-5">
        <div className="space-y-4">
          {fields.map(({ key, label, icon: Icon, placeholder }) => (
            <div key={key} className="space-y-1.5">
              <Label htmlFor={`s-${key}`} className="flex items-center gap-2">
                <Icon className="size-4" /> {label}
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id={`s-${key}`}
                  value={form[key]}
                  placeholder={placeholder}
                  autoComplete="off"
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                />
                {form[key] ? (
                  <Button asChild variant="ghost" size="icon" aria-label={t("admin.socialOpen")}>
                    <a href={form[key]} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="size-4" />
                    </a>
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-4 text-xs text-muted-foreground">{t("admin.socialHint")}</p>

        <div className="mt-5 flex justify-end">
          <Button disabled={save.isPending} onClick={() => save.mutate(form)}>
            {t("common.save")}
          </Button>
        </div>
      </div>
    </div>
  );
}
