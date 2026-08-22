import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Clock, Instagram, MapPin, MessageCircle, Phone, Star, Users } from "lucide-react";
import { EmptyState, InlineLoader } from "@/components/common/states";
import { tourCategoryIcon } from "@/components/tour/TourCategoryBadge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { refDataQuery } from "@/lib/data";
import { formatPrice } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/tour/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug.replace(/-/g, " ")} — Armenian tour | StayLand` },
      {
        name: "description",
        content: "Tour details, duration, meeting point and pricing for this Armenian experience.",
      },
      { property: "og:title", content: "Armenian tour experience — StayLand" },
      { property: "og:description", content: "Tour details, duration and pricing." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TourPage,
});

function TourPage() {
  const { slug } = Route.useParams();
  const { t, lang, localized } = useI18n();
  const { data, isPending } = useQuery({
    queryKey: ["tour", slug],
    queryFn: async () => {
      const { data, error } = await supabase.from("tours").select("*").eq("slug", slug).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const { data: ref } = useQuery(refDataQuery());

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

  const cat = ref?.categories.find((c) => c.code === data.category);
  const Icon = tourCategoryIcon(cat?.icon);
  const city = ref?.cities.find((c) => c.code === data.city_code);
  const whatsappNumber = data.contact_whatsapp?.replace(/[^\d]/g, "") ?? "";
  const instagramHandle =
    data.contact_instagram
      ?.replace(/^https?:\/\/(www\.)?instagram\.com\//, "")
      .replace(/^@/, "")
      .replace(/\/$/, "") ?? "";

  return (
    <div>
      {/* Hero */}
      <section className="relative">
        <div className="relative aspect-16/10 w-full overflow-hidden bg-surface sm:aspect-21/9">
          {data.main_image_url ? (
            <img src={data.main_image_url} alt={data.name} className="size-full object-cover" />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/85 via-foreground/25 to-transparent" />
        </div>
        <div className="container-page relative z-10 -mt-28 pb-2 sm:-mt-32">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand px-3 py-1 text-xs font-semibold text-brand-foreground">
              <Icon className="size-3.5" /> {cat ? localized(cat, "name") : data.category}
            </span>
            <h1 className="mt-3 font-display text-3xl font-semibold text-background drop-shadow-md md:text-4xl">
              {data.name}
            </h1>
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-background/90">
              <span className="flex items-center gap-1.5">
                <MapPin className="size-4" /> {city ? localized(city, "name") : data.location || data.city_code}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="size-4" /> {data.duration_hours} {t("tours.hours")}
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="size-4" /> {data.max_participants} {t("tours.maxParticipants")}
              </span>
              {data.review_count > 0 ? (
                <span className="flex items-center gap-1.5">
                  <Star className="size-4 fill-gold text-gold" /> {Number(data.rating).toFixed(1)} ({data.review_count})
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <div className="container-page mt-6 grid gap-10 lg:grid-cols-[1fr_20rem]">
        <div>
          <section>
            <h2 className="font-display text-xl font-semibold">{t("tours.aboutTour")}</h2>
            <p className="mt-3 whitespace-pre-line leading-relaxed text-muted-foreground">{data.description}</p>
          </section>

          {data.meeting_point ? (
            <section className="mt-8 rounded-2xl border border-border bg-card p-5">
              <h2 className="font-display text-base font-semibold">{t("tours.meetingPoint")}</h2>
              <p className="mt-2 flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="mt-0.5 size-4 shrink-0 text-brand" /> {data.meeting_point}
              </p>
            </section>
          ) : null}
        </div>

        <aside className="h-fit rounded-2xl border border-border bg-card p-5 shadow-card lg:sticky lg:top-24">
          <p className="text-xs text-muted-foreground">{t("common.from")}</p>
          <p className="font-display text-3xl font-semibold text-brand">
            {formatPrice(Number(data.price), data.currency ?? "AMD", lang)}
          </p>
          <p className="text-xs text-muted-foreground">/ {t("common.person")}</p>
          <div className="mt-5 space-y-2">
            {data.contact_phone ? (
              <Button asChild className="h-auto w-full justify-start py-3">
                <a href={`tel:${data.contact_phone}`}>
                  <Phone className="size-5 shrink-0" />
                  <span className="min-w-0 text-left">
                    <span className="block text-xs opacity-75">{t("property.call")}</span>
                    <span className="block truncate">{data.contact_phone}</span>
                  </span>
                </a>
              </Button>
            ) : null}
            {whatsappNumber ? (
              <Button asChild variant="outline" className="h-auto w-full justify-start py-3">
                <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noreferrer">
                  <MessageCircle className="size-5 shrink-0" />
                  <span className="min-w-0 text-left">
                    <span className="block text-xs text-muted-foreground">{t("property.whatsapp")}</span>
                    <span className="block truncate">{data.contact_whatsapp}</span>
                  </span>
                </a>
              </Button>
            ) : null}
            {instagramHandle ? (
              <Button asChild variant="outline" className="h-auto w-full justify-start py-3">
                <a href={`https://instagram.com/${instagramHandle}`} target="_blank" rel="noreferrer">
                  <Instagram className="size-5 shrink-0" />
                  <span className="min-w-0 text-left">
                    <span className="block text-xs text-muted-foreground">{t("property.instagram")}</span>
                    <span className="block truncate">@{instagramHandle}</span>
                  </span>
                </a>
              </Button>
            ) : null}
          </div>
        </aside>
      </div>
    </div>
  );
}
