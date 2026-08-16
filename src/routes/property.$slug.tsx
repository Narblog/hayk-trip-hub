import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BedDouble, Bath, MapPin, Phone, Star, Users } from "lucide-react";
import { EmptyState, InlineLoader } from "@/components/common/states";
import { FavoriteButton } from "@/components/property/FavoriteButton";
import { AvailabilityCalendar } from "@/components/property/AvailabilityCalendar";
import { Button } from "@/components/ui/button";
import { propertyQuery } from "@/lib/data";
import { formatPrice } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/property/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug.replace(/-/g, " ")} — stay in Armenia | Hyur` },
      { name: "description", content: "Photos, amenities, availability and host contact details for this Armenian stay." },
      { property: "og:title", content: "Stay in Armenia — Hyur" },
      { property: "og:description", content: "Photos, amenities and availability for this Armenian stay." },
    ],
  }),
  component: PropertyPage,
});

type Img = { id: string; image_url: string; is_cover: boolean | null; sort_order: number };

function PropertyPage() {
  const { slug } = Route.useParams();
  const { t, lang } = useI18n();
  const { data, isPending } = useQuery(propertyQuery(slug));

  if (isPending) return <InlineLoader />;
  if (!data)
    return (
      <div className="container-page py-16">
        <EmptyState title={t("empty.noResults")}>
          <Button asChild variant="outline">
            <Link to="/search">{t("fav.browse")}</Link>
          </Button>
        </EmptyState>
      </div>
    );

  const p = data as unknown as {
    id: string; name: string; description: string | null; city_code: string | null;
    price_per_night: number; currency: string; max_guests: number; bedrooms: number;
    bathrooms: number; rating: number; review_count: number; main_image_url: string | null;
    address: string | null; contact_phone: string | null; house_rules: string | null;
    property_images: Img[];
  };
  const images = (p.property_images ?? [])
    .slice()
    .sort((a, b) => Number(b.is_cover) - Number(a.is_cover) || a.sort_order - b.sort_order)
    .map((image) => image.image_url)
    .filter(Boolean);
  const gallery = images.length ? images : p.main_image_url ? [p.main_image_url] : [];

  return (
    <div className="container-page py-8">
      <div className="grid gap-2 overflow-hidden rounded-3xl sm:grid-cols-4 sm:grid-rows-2">
        {gallery.slice(0, 5).map((url, i) => (
          <img
            key={url + i}
            src={url}
            alt={p.name}
            loading={i === 0 ? "eager" : "lazy"}
            className={`h-full w-full object-cover ${i === 0 ? "sm:col-span-2 sm:row-span-2 aspect-4/3" : "aspect-4/3 hidden sm:block"}`}
          />
        ))}
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_22rem]">
        <div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl font-semibold">{p.name}</h1>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="size-4" /> {p.address || p.city_code}
              </p>
            </div>
            <FavoriteButton propertyId={p.id} className="border border-border" />
          </div>

          <div className="mt-5 flex flex-wrap gap-5 border-y border-border py-4 text-sm">
            <span className="flex items-center gap-1.5"><Users className="size-4" /> {p.max_guests} {t("card.guests")}</span>
            <span className="flex items-center gap-1.5"><BedDouble className="size-4" /> {p.bedrooms} {t("card.bedrooms")}</span>
            <span className="flex items-center gap-1.5"><Bath className="size-4" /> {p.bathrooms} {t("property.bathrooms")}</span>
            {p.review_count > 0 ? (
              <span className="flex items-center gap-1.5"><Star className="size-4 fill-gold text-gold" /> {Number(p.rating).toFixed(1)} ({p.review_count})</span>
            ) : null}
          </div>

          <section className="mt-8">
            <h2 className="font-display text-xl font-semibold">{t("property.about")}</h2>
            <p className="mt-3 whitespace-pre-line leading-relaxed text-muted-foreground">{p.description}</p>
          </section>

          {p.house_rules ? (
            <section className="mt-8">
              <h2 className="font-display text-xl font-semibold">{t("property.rules")}</h2>
              <p className="mt-3 whitespace-pre-line text-muted-foreground">{p.house_rules}</p>
            </section>
          ) : null}

          <section className="mt-8">
            <h2 className="font-display text-xl font-semibold">{t("cal.title")}</h2>
            <div className="mt-3 max-w-md">
              <AvailabilityCalendar propertyId={p.id} />
            </div>
          </section>
        </div>

        <aside className="h-fit rounded-2xl border border-border bg-card p-5 shadow-card lg:sticky lg:top-24">
          <p className="font-display text-2xl font-semibold">
            {formatPrice(Number(p.price_per_night), p.currency ?? "AMD", lang)}
            <span className="ml-1 text-sm font-normal text-muted-foreground">/ {t("card.perNight")}</span>
          </p>
          {p.contact_phone ? (
            <Button asChild className="mt-5 w-full">
              <a href={`tel:${p.contact_phone}`}>
                <Phone className="size-4" /> {t("property.call")}
              </a>
            </Button>
          ) : null}
          <p className="mt-3 text-xs text-muted-foreground">{t("property.approxLocation")}</p>
        </aside>
      </div>
    </div>
  );
}
