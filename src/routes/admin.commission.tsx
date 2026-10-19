import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Percent } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { adminSaveCommissionPercent, commissionPercentQuery } from "@/lib/data";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/admin/commission")({
  head: () => ({
    meta: [
      { title: "Միջնորդավճար — StayLand admin" },
      { name: "description", content: "Սահմանեք ամրագրումներից գանձվող միջնորդավճարի տոկոսը։" },
      { property: "og:title", content: "Միջնորդավճար — StayLand admin" },
      { property: "og:description", content: "Ամրագրումների միջնորդավճարի տոկոսի կարգավորում։" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminCommissionPage,
});

function AdminCommissionPage() {
  const { t } = useI18n();
  const { isAdmin, user } = useAuth();
  const qc = useQueryClient();
  const current = useQuery({ ...commissionPercentQuery(), enabled: isAdmin });
  const [value, setValue] = useState("");
  const [filled, setFilled] = useState(false);

  useEffect(() => {
    if (current.data != null && !filled) {
      setValue(String(current.data));
      setFilled(true);
    }
  }, [current.data, filled]);

  const save = useMutation({
    mutationFn: (percent: number) => adminSaveCommissionPercent(user!.id, percent),
    onSuccess: (v) => {
      setValue(String(v));
      toast.success(t("admin.commissionSaved"));
      void qc.invalidateQueries({ queryKey: ["platform-settings", "commission_percent"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!isAdmin)
    return <div className="container-page py-16 text-center text-muted-foreground">{t("error.title")}</div>;

  const percent = Number(value);

  return (
    <div className="container-page py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-semibold">{t("admin.commissionTitle")}</h1>
        <Button asChild variant="outline" size="sm">
          <Link to="/admin">{t("admin.overview")}</Link>
        </Button>
      </div>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{t("admin.commissionSub")}</p>

      <div className="mt-6 max-w-xl rounded-2xl border border-border bg-card p-5">
        <div className="space-y-1.5">
          <Label htmlFor="commission" className="flex items-center gap-2">
            <Percent className="size-4" /> {t("admin.commissionLabel")}
          </Label>
          <Input
            id="commission"
            type="number"
            min={0}
            max={100}
            step={0.5}
            value={value}
            autoComplete="off"
            onChange={(e) => setValue(e.target.value)}
          />
        </div>
        <p className="mt-4 text-xs text-muted-foreground">{t("admin.commissionHint")}</p>
        <div className="mt-5 flex justify-end">
          <Button
            disabled={save.isPending || !Number.isFinite(percent) || percent < 0 || percent > 100}
            onClick={() => save.mutate(percent)}
          >
            {t("common.save")}
          </Button>
        </div>
      </div>
    </div>
  );
}
