import { createFileRoute, Link, ClientOnly } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { CarFront, ChevronLeft, ChevronRight, ExternalLink, Images, Instagram, MapPin, MessageCircle, Phone, Share2, ShieldCheck, Star, Users, X } from "lucide-react";
import { toast } from "sonner";
import { EmptyState, InlineLoader } from "@/components/common/states";
import { FavoriteButton } from "@/components/property/FavoriteButton";
import { AvailabilityCalendar } from "@/components/property/AvailabilityCalendar";
import { BookingRequestCard } from "@/components/property/BookingRequestCard";

import { AmenityIcon } from "@/components/property/AmenityIcon";
import { ReviewsSection } from "@/components/property/ReviewsSection";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { trackPropertyEvent } from "@/lib/analytics";
import { propertyHostQuery, propertyQuery, refDataQuery, relatedToursQuery, similarPropertiesQuery, type SimilarProperty } from "@/lib/data";
import { formatPrice } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

const PropertyMiniMap = lazy(() => import("@/components/property/PropertyMiniMap"));

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

function SimilarStays({ cityCode, regionCode, excludeId }: { cityCode: string | null; regionCode: string | null; excludeId: string | null }) {
  const { t, lang, localized } = useI18n();
  const { data: ref } = useQuery(refDataQuery());
  const { data } = useQuery(similarPropertiesQuery(cityCode, regionCode, excludeId));
  const items = (data ?? []) as SimilarProperty[];
  if (!items.length) return null;

  return (
    <section className="mt-12">
      <div className="flex items-end justify-between gap-4">
        <h2 className="font-display text-xl font-semibold">{t("property.similarStays")}</h2>
        <Link
          to="/search"
          search={{ destination: "", checkIn: "", checkOut: "", guests: 2, sort: "recommended", page: 1, types: [], amenities: [], minPrice: 0, maxPrice: 200000, bedrooms: 0, minRating: 0, view: "list" }}
          className="shrink-0 rounded-full border border-border px-4 py-2 text-xs font-semibold transition-colors hover:border-brand hover:text-brand"
        >
          {t("property.viewMore")}
        </Link>
      </div>
      <div className="scrollbar-none -mx-4 mt-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-4 sm:overflow-visible sm:px-0 sm:pb-0">
        {items.map((sp) => (
          <Link
            key={sp.id}
            to="/property/$slug"
            params={{ slug: sp.slug }}
            className="group relative w-[70%] shrink-0 snap-start overflow-hidden rounded-3xl sm:w-auto"
          >
            <div className="relative aspect-4/3 overflow-hidden bg-surface">
              {sp.main_image_url ? (
                <img
                  src={sp.main_image_url}
                  alt={sp.name}
                  loading="lazy"
                  className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/10 to-transparent" />
              <div className="absolute right-3 top-3">
                <FavoriteButton propertyId={sp.id} />
              </div>
              <div className="absolute inset-x-3 bottom-3 text-background">
                <p className="line-clamp-1 text-sm font-semibold">{sp.name}</p>
                <p className="mt-0.5 flex items-center justify-between text-xs opacity-90">
                  <span>{localized(ref?.cities.find((c) => c.code === sp.city_code), "name") || sp.city_code}</span>
                  {sp.review_count > 0 ? (
                    <span className="flex items-center gap-1 font-semibold">
                      <Star className="size-3 fill-gold text-gold" />
                      {Number(sp.rating).toFixed(1)} ({sp.review_count})
                    </span>
                  ) : null}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

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
  const { data: host } = useQuery(propertyHostQuery(propertyId ?? undefined));

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
    property_type: string | null;
    price_per_night: number; currency: string; max_guests: number; bedrooms: number;
    bathrooms: number; rating: number; review_count: number; main_image_url: string | null;
    address: string | null; contact_phone: string | null; contact_whatsapp: string | null;
    contact_instagram: string | null; house_rules: string | null; owner_id: string | null;
    latitude: number | null; longitude: number | null;
    property_images: Img[];
    property_amenities?: { amenity_code: string }[];
  };
  const hasLocation = p.latitude != null && p.longitude != null;
  const city = ref?.cities.find((c) => c.code === p.city_code) ?? null;
  const region = ref?.regions.find((r) => r.code === p.region_code) ?? null;
  const typeRow = ref?.types.find((tp) => tp.code === p.property_type) ?? null;
  const cityName = localized(city, "name") || p.city_code || "";
  const regionName = localized(region, "name") || p.region_code || "";
  const locationLine = [p.address || cityName, regionName && regionName !== cityName ? regionName : "", "Armenia"].filter(Boolean).join(", ");
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

  async function sharePage() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: p.name, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success(t("property.linkCopied"));
      }
    } catch {
      // user cancelled
    }
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
      addressLocality: cityName || undefined,
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
        {p.review_count > 0 ? (
          <span className="absolute bottom-4 left-4 flex items-center gap-1.5 rounded-full bg-card/95 px-3.5 py-2 text-sm font-semibold shadow-card backdrop-blur">
            <Star className="size-4 fill-gold text-gold" />
            {Number(p.rating).toFixed(1)}
            <span className="font-normal text-muted-foreground">({p.review_count} {t("property.reviews").toLowerCase()})</span>
          </span>
        ) : null}
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

      <nav aria-label="Breadcrumb" className="mt-6 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
        <Link to="/" className="hover:text-brand">{t("nav.home")}</Link>
        {regionName ? (
          <>
            <span aria-hidden>/</span>
            <span>{regionName}</span>
          </>
        ) : null}
        {cityName ? (
          <>
            <span aria-hidden>/</span>
            <span>{cityName}</span>
          </>
        ) : null}
        <span aria-hidden>/</span>
        <span className="text-foreground">{p.name}</span>
      </nav>

      <div className="mt-4 grid gap-10 lg:grid-cols-[1fr_22rem]">
        <div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <h1 className="font-display text-2xl font-semibold leading-tight sm:text-3xl">{p.name}</h1>
            <div className="-ml-3 flex shrink-0 items-center gap-1 sm:ml-0">
              <FavoriteButton propertyId={p.id} label={t("property.save")} />
              <button
                type="button"
                onClick={() => void sharePage()}
                className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
              >
                <Share2 className="size-4.5" />
                <span>{t("property.share")}</span>
              </button>
            </div>
          </div>


          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><MapPin className="size-4" /> {locationLine}</span>
            {p.review_count > 0 ? (
              <a href="#reviews" className="flex items-center gap-1.5 hover:text-brand">
                <Star className="size-4 fill-gold text-gold" /> {Number(p.rating).toFixed(1)} ({p.review_count} {t("property.reviews").toLowerCase()})
              </a>
            ) : null}
            {typeRow ? (
              <span className="flex items-center gap-1.5 border-l border-border pl-4">{localized(typeRow, "name")}</span>
            ) : null}
            <span className="flex items-center gap-1.5 border-l border-border pl-4">
              <Users className="size-4" /> {t("property.upToGuests").replace("{n}", String(p.max_guests))}
            </span>
          </div>

          {p.description ? (
            <p className="mt-4 whitespace-pre-line leading-relaxed text-muted-foreground">{p.description}</p>
          ) : null}

          <div aria-hidden="true" className="mt-5 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 text-brand">
            <span className="h-px bg-border" />
            <CarFront className="size-5" strokeWidth={1.75} />
            <span className="h-px bg-border" />
          </div>

          {amenityList.length ? (
            <section className="mt-4">
              <h2 className="font-display text-xl font-semibold">{t("property.amenities")}</h2>
              <div className="mt-4 flex flex-wrap gap-2.5">
                {amenityList.map((a) => (
                  <span key={a.code} className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm">
                    <AmenityIcon icon={a.icon} className="size-4.5 text-brand" />
                    {localized(a, "name")}
                  </span>
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

          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
            <section>
              <h2 className="font-display text-xl font-semibold">{t("cal.title")}</h2>
              <div className="mt-3">
                <AvailabilityCalendar propertyId={p.id} />
              </div>
            </section>

            <div id="reviews" className="scroll-mt-24">
              <ReviewsSection propertyId={p.id} ownerId={p.owner_id ?? null} />
            </div>
          </div>
        </div>



        <aside className="h-fit overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-card lg:sticky lg:top-24">
          <BookingRequestCard
            propertyId={p.id}
            propertyTitle={p.name}
            maxGuests={Number(p.max_guests) || 2}
            fallbackPrice={Number(p.price_per_night)}
            currency={p.currency ?? "AMD"}
            embedded
          />

          {(p.contact_phone || whatsappNumber || instagramHandle) ? (
            <div className="mt-4 grid grid-cols-2 gap-2">
              {p.contact_phone ? (
                <Button asChild variant="outline" className="min-w-0">
                  <a href={`tel:${p.contact_phone}`} onClick={() => void trackPropertyEvent(p.id, "phone_click")}>
                    <Phone className="size-4 shrink-0" />
                    <span className="truncate">{p.contact_phone}</span>
                  </a>
                </Button>
              ) : null}
              {instagramHandle ? (
                <Button asChild variant="outline" className="min-w-0">
                  <a href={`https://instagram.com/${instagramHandle}`} target="_blank" rel="noreferrer" onClick={() => void trackPropertyEvent(p.id, "instagram_click")}>
                    <Instagram className="size-4 shrink-0" />
                    <span className="truncate">Instagram</span>
                  </a>
                </Button>
              ) : whatsappNumber ? (
                <Button asChild variant="outline" className="min-w-0">
                  <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noreferrer" onClick={() => void trackPropertyEvent(p.id, "whatsapp_click")}>
                    <MessageCircle className="size-4 shrink-0" />
                    <span className="truncate">{t("property.whatsapp")}</span>
                  </a>
                </Button>
              ) : null}
            </div>
          ) : null}

          <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="size-4 text-brand" />
            {t("property.secureBooking")}
          </p>

          <section className="mt-5 border-t border-border pt-5">
            {hasLocation ? (
              <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] overflow-hidden rounded-xl border border-border">
                <div className="overflow-hidden">
                  <ClientOnly fallback={<Skeleton className="h-32 w-full" />}>
                    <Suspense fallback={<Skeleton className="h-32 w-full" />}>
                      <PropertyMiniMap lat={Number(p.latitude)} lng={Number(p.longitude)} className="h-32 w-full" />
                    </Suspense>
                  </ClientOnly>
                </div>
                <div className="min-w-0 p-3">
                  <h2 className="font-display text-base font-semibold">{t("property.location")}</h2>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{locationLine}</p>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${p.latitude},${p.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
                  >
                    {t("property.openInMaps")}
                    <ExternalLink className="size-3 shrink-0" />
                  </a>
                </div>
              </div>
            ) : (
              <div>
                <h2 className="font-display text-base font-semibold">{t("property.location")}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{locationLine}</p>
              </div>
            )}
            <p className="mt-2 text-xs text-muted-foreground">{t("property.approxLocation")}</p>
          </section>

          <section className="mt-5 border-t border-border pt-5">
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-full bg-surface">
                {host?.avatar_url ? (
                  <img src={host.avatar_url} alt={host.full_name ?? ""} className="size-full object-cover" />
                ) : hostName ? (
                  <span className="font-display text-lg font-semibold text-muted-foreground">
                    {hostName
                      .split(/\s+/)
                      .slice(0, 2)
                      .map((w) => w[0]?.toUpperCase() ?? "")
                      .join("")}
                  </span>
                ) : (
                  <Users className="size-5 text-muted-foreground" />
                )}
              </div>
              <div className="min-w-0">
                <p className="flex min-w-0 flex-wrap items-center gap-2 font-display text-base font-semibold">
                  <span className="truncate">{t("property.hostedBy")} {hostName || "StayLand"}</span>
                  {p.review_count >= 5 && Number(p.rating) >= 4.5 ? (
                    <span className="shrink-0 rounded-full border border-brand/30 bg-brand/10 px-2 py-0.5 text-[10px] font-semibold text-brand">{t("property.superhost")}</span>
                  ) : null}
                </p>
                {hostName ? <p className="truncate text-xs text-muted-foreground">{hostName}</p> : null}
              </div>
            </div>
            {p.contact_phone ? (
              <Button asChild variant="outline" className="mt-4 w-full">
                <a href={`tel:${p.contact_phone}`}>{t("property.contactHost")}</a>
              </Button>
            ) : null}
          </section>
        </aside>

      </div>

      <SimilarStays cityCode={p.city_code ?? null} regionCode={p.region_code ?? null} excludeId={p.id} />
      <RelatedTours regionCode={p.region_code ?? null} cityCode={p.city_code ?? null} />
    </div>
  );
}
