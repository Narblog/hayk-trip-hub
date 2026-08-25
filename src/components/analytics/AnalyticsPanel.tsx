import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ErrorState, InlineLoader } from "@/components/common/states";
import { analyticsDailyQuery, analyticsOverviewQuery } from "@/lib/data";
import { useI18n } from "@/lib/i18n";

const PERIODS: { days: number | null; key: string }[] = [
  { days: 7, key: "analytics.7" },
  { days: 30, key: "analytics.30" },
  { days: 90, key: "analytics.90" },
  { days: null, key: "analytics.all" },
];

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold">{value.toLocaleString()}</p>
    </div>
  );
}

function Trend({ rows }: { rows: { day: string; views: number; contacts: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => Number(r.views) + Number(r.contacts)));
  return (
    <div className="scrollbar-none mt-3 flex h-40 items-end gap-1.5 overflow-x-auto rounded-2xl border border-border bg-card p-4">
      {rows.map((r) => {
        const views = Number(r.views);
        const contacts = Number(r.contacts);
        return (
          <div key={r.day} className="flex min-w-4 flex-1 flex-col items-center justify-end gap-1" title={`${r.day}: ${views} / ${contacts}`}>
            <div className="w-full rounded-t bg-brand" style={{ height: `${(views / max) * 100}%` }} />
            <div className="w-full rounded-b bg-gold" style={{ height: `${(contacts / max) * 100}%` }} />
          </div>
        );
      })}
    </div>
  );
}

export function AnalyticsPanel({
  ownerId,
  properties,
  title,
}: {
  ownerId?: string | null;
  properties?: { id: string; name: string }[];
  title?: string;
}) {
  const { t } = useI18n();
  const [days, setDays] = useState<number | null>(30);
  const [propertyId, setPropertyId] = useState<string>("");

  const filters = { days, propertyId: propertyId || null, ownerId: ownerId ?? null };
  const overview = useQuery(analyticsOverviewQuery(filters));
  const daily = useQuery(analyticsDailyQuery(filters));

  const rows = overview.data ?? [];
  const totals = rows.reduce(
    (acc, r) => ({
      views: acc.views + Number(r.total_views),
      unique: acc.unique + Number(r.unique_visitors),
      contacts: acc.contacts + Number(r.contact_clicks),
      phone: acc.phone + Number(r.phone_clicks),
      whatsapp: acc.whatsapp + Number(r.whatsapp_clicks),
      instagram: acc.instagram + Number(r.instagram_clicks),
    }),
    { views: 0, unique: 0, contacts: 0, phone: 0, whatsapp: 0, instagram: 0 },
  );

  return (
    <section className="mt-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl font-semibold">{title ?? t("analytics.title")}</h2>
        <div className="flex flex-wrap gap-2">
          {properties?.length ? (
            <select
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              className="rounded-full border border-border bg-card px-3 py-1.5 text-sm"
            >
              <option value="">{t("analytics.allProperties")}</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          ) : null}
          <div className="flex flex-wrap gap-1.5">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => setDays(p.days)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  days === p.days ? "border-brand bg-brand text-brand-foreground" : "border-border bg-card"
                }`}
              >
                {t(p.key)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {overview.isPending ? (
        <InlineLoader />
      ) : overview.isError ? (
        <div className="mt-4">
          <ErrorState
            message={overview.error instanceof Error ? overview.error.message : undefined}
            onRetry={() => overview.refetch()}
          />
        </div>
      ) : rows.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">{t("analytics.empty")}</p>
      ) : (
        <>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <Metric label={t("analytics.views")} value={totals.views} />
            <Metric label={t("analytics.uniqueVisitors")} value={totals.unique} />
            <Metric label={t("analytics.contacts")} value={totals.contacts} />
            <Metric label={t("analytics.phone")} value={totals.phone} />
            <Metric label={t("analytics.whatsapp")} value={totals.whatsapp} />
            <Metric label={t("analytics.instagram")} value={totals.instagram} />
          </div>

          <div className="mt-6">
            <p className="eyebrow text-xs text-muted-foreground">{t("analytics.trend")}</p>
            {daily.isPending ? (
              <InlineLoader />
            ) : (daily.data ?? []).length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">{t("analytics.empty")}</p>
            ) : (
              <Trend rows={daily.data ?? []} />
            )}
          </div>

          <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-card">
            <table className="w-full min-w-[38rem] text-sm">
              <thead className="bg-surface text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">{t("analytics.property")}</th>
                  <th className="px-4 py-3">{t("analytics.views")}</th>
                  <th className="px-4 py-3">{t("analytics.uniqueVisitors")}</th>
                  <th className="px-4 py-3">{t("analytics.contacts")}</th>
                  <th className="px-4 py-3">{t("analytics.rating")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.property_id} className="border-t border-border/70">
                    <td className="px-4 py-3">{r.property_name}</td>
                    <td className="px-4 py-3">{Number(r.total_views)}</td>
                    <td className="px-4 py-3">{Number(r.unique_visitors)}</td>
                    <td className="px-4 py-3">{Number(r.contact_clicks)}</td>
                    <td className="px-4 py-3">
                      {Number(r.avg_rating) > 0 ? `${Number(r.avg_rating).toFixed(1)} (${Number(r.review_count)})` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
