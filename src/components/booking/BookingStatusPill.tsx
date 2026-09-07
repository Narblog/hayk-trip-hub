import type { BookingStatus } from "@/lib/data";
import { useI18n } from "@/lib/i18n";

const STYLES: Record<BookingStatus, string> = {
  PENDING: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  ACCEPTED: "bg-emerald-600/15 text-emerald-700 dark:text-emerald-400",
  DECLINED: "bg-destructive/10 text-destructive",
  CANCELLED: "bg-muted text-muted-foreground",
  COMPLETED: "bg-brand-soft text-brand",
};

export function BookingStatusPill({ status }: { status: BookingStatus }) {
  const { t } = useI18n();
  return (
    <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${STYLES[status]}`}>
      {t(`bstatus.${status}`)}
    </span>
  );
}
