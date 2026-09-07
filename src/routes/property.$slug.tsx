import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { BedDouble, Bath, ChevronLeft, ChevronRight, Instagram, Images, MapPin, MessageCircle, Phone, Star, Users, X } from "lucide-react";
import { EmptyState, InlineLoader } from "@/components/common/states";
import { FavoriteButton } from "@/components/property/FavoriteButton";
import { AvailabilityCalendar } from "@/components/property/AvailabilityCalendar";
import { AmenityIcon } from "@/components/property/AmenityIcon";
import { ReviewsSection } from "@/components/property/ReviewsSection";
import { Button } from "@/components/ui/button";
import { trackPropertyEvent } from "@/lib/analytics";
import { propertyQuery, refDataQuery, relatedToursQuery } from "@/lib/data";
import { formatPrice } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/property/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug.replace(/-/g, " ")} — stay in Armenia | StayLand` },
      { name: "description", content: "Photos, amenities, availability and host contact details for this Armenian stay." },
      { property: "og:title", content: "Stay in Armenia — StayLand" },
      { property: "og:description", content: "Photos, amenities and availability for this Armenian stay." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PropertyPage,
});

type Img = { id: string; image_url: string; is_cover: boolean | null; sort_order: number };

function RelatedTours({ regionCode, cityCode }: { regionCode: string | null; cityCode: string | null }) {
  const { t, lang, localized } = useI18n();
  const { data: ref } = useQuery(refDataQuery());
  const { data } = useQuery(relatedToursQuery(regionCode, cityCode));
  const tours = data ?? [];
  if (!tours.length) return null;

  return (
    <section className="mt-12">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-semibold">{t("related.tours")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("related.toursSub")}</p>
        </div>
        <Link
          to="/tours"
          className="shrink-0 rounded-full border border-border px-4 py-2 text-xs font-semibold transition-colors hover:border-brand hover:text-brand"
        >
          {t("related.seeAllTours")}
        </Link>
      </div>

      <div className="scrollbar-none -mx-4 mt-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 sm:pb-0">
        {tours.map((tr) => (
          <Link
            key={tr.id}
            to="/tour/$slug"
            params={{ slug: tr.slug }}
            className="group w-[82%] shrink-0 snap-start overflow-hidden rounded-3xl border border-border/70 bg-card shadow-card transition-all hover:-translate-y-1 hover:shadow-lift sm:w-auto"
          >
            <div className="relative aspect-16/10 overflow-hidden bg-surface">
              {tr.main_image_url ? (
                <img
                  src={tr.main_image_url}
                  alt={tr.name}
                  loading="lazy"
                  className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : null}
              {tr.review_count > 0 ? (
                <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-card/90 px-2.5 py-1 text-xs font-semibold backdrop-blur">
                  <Star className="size-3 fill-gold text-gold" />
                  {Number(tr.rating).toFixed(1)}
                </span>
              ) : null}
            </div>
            <div className="space-y-2 p-4">
              <h3 className="line-clamp-1 font-display text-base font-semibold">{tr.name}</h3>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="size-3.5" />
                {localized(ref?.cities.find((c) => c.code === tr.city_code), "name") || tr.location || tr.city_code}
              </p>
              <p className="font-display text-base text-brand">
                {formatPrice(Number(tr.price), tr.currency ?? "AMD", lang)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}


function PropertyPage() {
  const { slug } = Route.useParams();
  const { t, lang, localized } = useI18n();
  const { data, isPending } = useQuery(propertyQuery(slug));
  const { data: ref } = useQuery(refDataQuery());
  const [activeImage, setActiveImage] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const propertyId = (data as { id?: string } | null | undefined)?.id ?? null;

  useEffect(() => {
    if (propertyId) void trackPropertyEvent(propertyId, "property_view");
  }, [propertyId]);

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
    id: string; name: string; description: string | null; city_code: string | null; region_code: string | null;
    price_per_night: number; currency: string; max_guests: number; bedrooms: number;
    bathrooms: number; rating: number; review_count: number; main_image_url: string | null;
    address: string | null; contact_phone: string | null; contact_whatsapp: string | null;
    contact_instagram: string | null; house_rules: string | null; owner_id: string | null;
    property_images: Img[];
    property_amenities?: { amenity_code: string }[];
  };
  const amenityList = (p.property_amenities ?? [])
    .map((row) => (ref?.amenities ?? []).find((a) => a.code === row.amenity_code))
    .filter(Boolean) as { code: string; icon?: string | null }[];
  const images = (p.property_images ?? [])
    .slice()
    .sort((a, b) => Number(b.is_cover) - Number(a.is_cover) || a.sort_order - b.sort_order)
    .map((image) => image.image_url)
    .filter(Boolean);
  const gallery = images.length ? images : p.main_image_url ? [p.main_image_url] : [];
  const heroGallery = gallery.slice(0, 5);
  const whatsappNumber = p.contact_whatsapp?.replace(/[^\d]/g, "") ?? "";
  const instagramHandle = p.contact_instagram?.replace(/^https?:\/\/(www\.)?instagram\.com\//, "").replace(/^@/, "").replace(/\/$/, "") ?? "";

  function updateActiveImage() {
    const galleryElement = galleryRef.current;
    if (!galleryElement) return;
    const slides = Array.from(galleryElement.querySelectorAll<HTMLElement>("[data-gallery-slide]"));
    if (!slides.length) return;
    const center = galleryElement.scrollLeft + galleryElement.clientWidth / 2;
    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;
    slides.forEach((slide, index) => {
      const slideCenter = slide.offsetLeft + slide.offsetWidth / 2;
      const distance = Math.abs(center - slideCenter);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });
    setActiveImage(closestIndex);
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    name: p.name,
    description: p.description ?? undefined,
    image: gallery.slice(0, 5),
    address: {
      "@type": "PostalAddress",
      addressCountry: "AM",
      addressLocality: localized(ref?.cities.find((c) => c.code === p.city_code), "name") || p.city_code || undefined,
      streetAddress: p.address ?? undefined,
    },
    telephone: p.contact_phone ?? undefined,
    priceRange: formatPrice(Number(p.price_per_night), p.currency ?? "AMD", lang),
    ...(p.review_count > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: Number(p.rating).toFixed(1),
            reviewCount: p.review_count,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
  };

  return (
    <div className="container-page py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div
        ref={galleryRef}
        onScroll={updateActiveImage}
        className="scrollbar-none -mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 sm:mx-0 sm:hidden"
      >
        {gallery.map((url, i) => (
          <img
            key={url + i}
            data-gallery-slide
            src={url}
            alt={p.name}
            loading={i === 0 ? "eager" : "lazy"}
            onClick={() => setLightbox(i)}
            className="aspect-4/3 w-[88%] shrink-0 snap-center rounded-3xl object-cover"
          />
        ))}
      </div>
      {gallery.length > 1 ? (
        <p aria-live="polite" className="mt-2 text-center text-xs text-muted-foreground sm:hidden">{activeImage + 1} / {gallery.length}</p>
      ) : null}

      <div className="relative hidden sm:block">
        <div className="grid h-[26rem] grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-3xl">
          {heroGallery.map((url, i) => (
            <button
              key={url + i}
              type="button"
              onClick={() => setLightbox(i)}
              className={`group relative overflow-hidden ${i === 0 ? "col-span-2 row-span-2" : ""}`}
            >
              <img
                src={url}
                alt={p.name}
                loading={i === 0 ? "eager" : "lazy"}
                className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </button>
          ))}
        </div>
        {gallery.length > 1 ? (
          <button
            type="button"
            onClick={() => setLightbox(0)}
            className="absolute bottom-4 right-4 flex items-center gap-2 rounded-full border border-border bg-card/95 px-4 py-2 text-sm font-semibold shadow-card backdrop-blur transition-colors hover:border-brand hover:text-brand"
          >
            <Images className="size-4" /> {t("property.allPhotos")} ({gallery.length})
          </button>
        ) : null}
      </div>

      {lightbox !== null ? (
        <div className="fixed inset-0 z-100 flex flex-col bg-foreground/95 p-4">
          <div className="flex items-center justify-between text-background">
            <span className="text-sm">{lightbox + 1} / {gallery.length}</span>
            <button type="button" aria-label={t("property.closeGallery")} onClick={() => setLightbox(null)} className="rounded-full p-2 hover:bg-background/15">
              <X className="size-6" />
            </button>
          </div>
          <div className="relative flex min-h-0 flex-1 items-center justify-center">
            <img src={gallery[lightbox]} alt={p.name} className="max-h-full max-w-full rounded-2xl object-contain" />
            {gallery.length > 1 ? (
              <>
                <button
                  type="button"
                  aria-label="Previous"
                  onClick={() => setLightbox((n) => ((n ?? 0) - 1 + gallery.length) % gallery.length)}
                  className="absolute left-0 rounded-full bg-card/90 p-3 shadow-card"
                >
                  <ChevronLeft className="size-5" />
                </button>
                <button
                  type="button"
                  aria-label="Next"
                  onClick={() => setLightbox((n) => ((n ?? 0) + 1) % gallery.length)}
                  className="absolute right-0 rounded-full bg-card/90 p-3 shadow-card"
                >
                  <ChevronRight className="size-5" />
                </button>
              </>
            ) : null}
          </div>
          <div className="scrollbar-none mt-3 flex gap-2 overflow-x-auto">
            {gallery.map((url, i) => (
              <button key={url + i} type="button" onClick={() => setLightbox(i)} className={`size-16 shrink-0 overflow-hidden rounded-xl border-2 ${i === lightbox ? "border-brand" : "border-transparent opacity-70"}`}>
                <img src={url} alt="" className="size-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      ) : null}

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
            <a href="#reviews" className="flex items-center gap-1.5 hover:text-brand">
              {p.review_count > 0 ? (
                <>
                  <Star className="size-4 fill-gold text-gold" /> {Number(p.rating).toFixed(1)} ({p.review_count})
                </>
              ) : (
                <span className="text-muted-foreground">{t("reviews.new")}</span>
              )}
            </a>
          </div>

          <section className="mt-8">
            <h2 className="font-display text-xl font-semibold">{t("property.about")}</h2>
            <p className="mt-3 whitespace-pre-line leading-relaxed text-muted-foreground">{p.description}</p>
          </section>

          {amenityList.length ? (
            <section className="mt-8">
              <h2 className="font-display text-xl font-semibold">{t("property.amenities")}</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {amenityList.map((a) => (
                  <div key={a.code} className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-brand/30 bg-brand/10 text-brand">
                      <AmenityIcon icon={a.icon} className="size-5" />
                    </span>
                    <span className="min-w-0 truncate text-sm">{localized(a, "name")}</span>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

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

          <div id="reviews" className="scroll-mt-24">
            <ReviewsSection propertyId={p.id} ownerId={p.owner_id ?? null} />
          </div>

          <RelatedTours regionCode={p.region_code ?? null} cityCode={p.city_code ?? null} />
        </div>



        <aside className="h-fit space-y-4 lg:sticky lg:top-24">
          <BookingRequestCard
            propertyId={p.id}
            maxGuests={Number(p.max_guests) || 2}
            fallbackPrice={Number(p.price_per_night)}
            currency={p.currency ?? "AMD"}
          />
          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">

          <div className="mt-5 space-y-2">
            {p.contact_phone ? (
              <Button asChild className="h-auto w-full justify-start py-3">
                <a href={`tel:${p.contact_phone}`} onClick={() => void trackPropertyEvent(p.id, "phone_click")}>
                  <Phone className="size-5 shrink-0" />
                  <span className="min-w-0 text-left"><span className="block text-xs opacity-75">{t("property.call")}</span><span className="block truncate">{p.contact_phone}</span></span>
                </a>
              </Button>
            ) : null}
            {whatsappNumber ? (
              <Button asChild variant="outline" className="h-auto w-full justify-start py-3">
                <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noreferrer" onClick={() => void trackPropertyEvent(p.id, "whatsapp_click")}>
                  <MessageCircle className="size-5 shrink-0" />
                  <span className="min-w-0 text-left"><span className="block text-xs text-muted-foreground">{t("property.whatsapp")}</span><span className="block truncate">{p.contact_whatsapp}</span></span>
                </a>
              </Button>
            ) : null}
            {instagramHandle ? (
              <Button asChild variant="outline" className="h-auto w-full justify-start py-3">
                <a href={`https://instagram.com/${instagramHandle}`} target="_blank" rel="noreferrer" onClick={() => void trackPropertyEvent(p.id, "instagram_click")}>
                  <Instagram className="size-5 shrink-0" />
                  <span className="min-w-0 text-left"><span className="block text-xs text-muted-foreground">{t("property.instagram")}</span><span className="block truncate">@{instagramHandle}</span></span>
                </a>
              </Button>
            ) : null}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">{t("property.approxLocation")}</p>
          </div>
        </aside>

      </div>
    </div>
  );
}
