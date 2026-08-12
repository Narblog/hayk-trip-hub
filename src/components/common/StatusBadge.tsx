import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";

const TONE: Record<string, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  PENDING_REVIEW: "bg-warning/20 text-warning-foreground",
  APPROVED: "bg-success/15 text-success",
  REJECTED: "bg-destructive/15 text-destructive",
  SUSPENDED: "bg-destructive/10 text-destructive",
  CHANGES_REQUESTED: "bg-accent text-accent-foreground",
};

export function StatusBadge({ status }: { status: string }) {
  const { t } = useI18n();
  return (
    <Badge variant="secondary" className={`border-0 font-medium ${TONE[status] ?? "bg-muted"}`}>
      {t(`status.${status}`)}
    </Badge>
  );
}