import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { UserRound } from "lucide-react";
import { OwnerShell } from "@/components/owner/OwnerShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { profileQuery, updateProfileInfo, uploadAvatar } from "@/lib/data";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/owner/profile")({
  head: () => ({
    meta: [
      { title: "Host profile — StayLand Armenia" },
      { name: "description", content: "Update the name and photo guests see on your Armenian listings." },
      { property: "og:title", content: "Host profile — StayLand" },
      { property: "og:description", content: "Your public host details on StayLand." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OwnerProfilePage,
});

function OwnerProfilePage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: profile } = useQuery(profileQuery(user?.id ?? null));
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.full_name ?? "");
      setPhone(profile.phone ?? "");
    }
  }, [profile]);

  if (!user)
    return (
      <div className="container-page py-16 text-center">
        <Button asChild><Link to="/auth">{t("nav.login")}</Link></Button>
      </div>
    );

  const save = async () => {
    setBusy(true);
    try {
      await updateProfileInfo(user.id, { full_name: name.trim(), phone: phone.trim() });
      await qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success(t("owner.saved"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      await uploadAvatar(user.id, file);
      await qc.invalidateQueries({ queryKey: ["profile"] });
      await qc.invalidateQueries({ queryKey: ["property-host"] });
      toast.success(t("owner.saved"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <OwnerShell>
      <h1 className="font-display text-3xl font-semibold">{t("owner.profileTitle")}</h1>
      <p className="mt-1 text-muted-foreground">{t("owner.profileSub")}</p>

      <div className="mt-6 max-w-xl rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-4">
          <span className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-full bg-surface">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.full_name ?? ""} className="size-full object-cover" />
            ) : (
              <UserRound className="size-7 text-muted-foreground" />
            )}
          </span>
          <div>
            <p className="text-sm font-medium">{t("owner.photo")}</p>
            <Button variant="outline" size="sm" className="mt-2" disabled={busy} onClick={() => fileRef.current?.click()}>
              {t("owner.uploadPhoto")}
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                void pick(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </div>
        </div>

        <div className="mt-6 grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="host-name">{t("owner.fullName")}</Label>
            <Input id="host-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="host-phone">{t("owner.phone")}</Label>
            <Input id="host-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <Button onClick={save} disabled={busy} className="justify-self-start">
            {t("owner.save")}
          </Button>
        </div>
      </div>
    </OwnerShell>
  );
}
