import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import heroImg from "@/assets/packages-hero.jpg";
import { PackageCard } from "@/components/package/PackageCard";
import { EmptyState, ErrorState } from "@/components/common/states";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/lib/i18n";
import { packagesQuery } from "@/lib/packages";

export const Route = createFileRoute("/packages")({
  head: () => ({
    meta: [
      { title: "Ամանորյա փաթեթներ — StayLand Հայաստան" },
      { name: "description", content: "Ամանորյա և տոնական փաթեթներ Հայաստանի լավագույն հյուրատներում՝ ամսաթվերով, գներով և ներառված ծառայություններով։" },
      { property: "og:title", content: "Ամանորյա փաթեթներ — StayLand" },
      { property: "og:description", content: "Տոնական հանգիստ հյուրատներում՝ պատրաստի փաթեթներով։" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PackagesPage,
});

function PackagesPage() {
  const { t } = useI18n();
  const q = useQuery(packagesQuery());

  return (
    <div>
      <section className="relative overflow-hidden">
        <img src={heroImg} alt="" width={1600} height={704} fetchPriority="high" decoding="async" className="h-64 w-full object-cover sm:h-80" />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/30 to-transparent" />
        <div className="container-page absolute inset-x-0 bottom-0 pb-6 sm:pb-10">
          <p className="text-sm font-medium uppercase tracking-wider text-background/80">{t("packages.eyebrow")}</p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-background sm:text-5xl">{t("packages.title")}</h1>
          <p className="mt-2 max-w-xl text-sm text-background/90 sm:text-base">{t("packages.sub")}</p>
        </div>
      </section>

      <div className="container-page py-8 sm:py-12">
        {q.isPending ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-96 rounded-2xl" />)}
          </div>
        ) : q.isError ? (
          <ErrorState message={t("error.friendly")} onRetry={() => q.refetch()} />
        ) : q.data.length === 0 ? (
          <EmptyState title={t("packages.empty")} />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {q.data.map((p) => <PackageCard key={p.id} p={p} />)}
          </div>
        )}
      </div>
    </div>
  );
}
