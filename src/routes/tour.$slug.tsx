import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Clock, Users } from "lucide-react";
import { EmptyState, InlineLoader } from "@/components/common/states";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/tour/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug.replace(/-/g, " ")} — Armenian tour | Hyur` },
      { name: "description", content: "Tour details, duration, meeting point and pricing for this Armenian experience." },
      { property: "og:title", content: "Armenian tour experience — Hyur" },
      { property: "og:description", content: "Tour details, duration and pricing." },
    ],
  }),
  component: TourPage,
});

function TourPage() {
  const { slug } = Route.useParams();
  const { t, lang } = useI18n();
  const { data, isPending } = useQuery({
    queryKey: ["tour", slug],
    queryFn: async () => {
      const { data, error } = await supabase.from("tours").select("*").eq("slug", slug).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (isPending) return <InlineLoader />;
  if (!data)
    return (
      <div className="container-page py-16">
        <EmptyState title={t("empty.noResults")}>
          <Button asChild variant="outline">
            <Link to="/tours">{t("nav.tours")}</Link>
          </Button>
        </EmptyState>
      </div>
    );

  return (
    <div className="container-page py-10">
      <div className="overflow-hidden rounded-3xl bg-surface">
        {data.main_image_url ? (
          <img src={data.main_image_url} alt={data.name} className="aspect-21/9 w-full object-cover" />
        ) : null}
      </div>
      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_20rem]">
        <div>
          <h1 className="font-display text-3xl font-semibold">{data.name}</h1>
          <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Clock className="size-4" /> {data.duration_hours} {t("tours.hours")}
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="size-4" /> {t("tours.maxParticipants")}: {data.max_participants}
            </span>
          </div>
          <p className="mt-6 whitespace-pre-line leading-relaxed text-muted-foreground">{data.description}</p>
          {data.meeting_point ? (
            <p className="mt-6 text-sm">
              <span className="font-semibold">{t("tours.meetingPoint")}: </span>
              {data.meeting_point}
            </p>
          ) : null}
        </div>
        <aside className="h-fit rounded-2xl border border-border bg-card p-5 shadow-card lg:sticky lg:top-24">
          <p className="font-display text-2xl font-semibold">
            {formatPrice(Number(data.price), data.currency ?? "AMD", lang)}
          </p>
          <p className="text-xs text-muted-foreground">/ {t("common.person")}</p>
          <Button className="mt-4 w-full" asChild>
            <a href={data.contact_phone ? `tel:${data.contact_phone}` : "#"}>{t("tours.book")}</a>
          </Button>
        </aside>
      </div>
    </div>
  );
}