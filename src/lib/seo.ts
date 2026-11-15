import { supabase } from "@/integrations/supabase/client";

export const SITE = "https://www.stayland.am";

export type SeoItem = { name: string; description: string; image: string | null; price: number; currency: string; city?: string | null };

const clip = (s: string | null | undefined, n = 160) => {
  const t = (s ?? "").replace(/\s+/g, " ").trim();
  return t.length > n ? `${t.slice(0, n - 1)}…` : t;
};

export async function loadPropertySeo(slug: string): Promise<SeoItem | null> {
  try {
    const { data } = await supabase
      .from("properties")
      .select("name,name_hy,description,description_hy,main_image_url,price_per_night,currency")
      .eq("slug", slug)
      .maybeSingle();
    if (!data) return null;
    return {
      name: data.name_hy || data.name,
      description: clip(data.description_hy || data.description),
      image: data.main_image_url,
      price: Number(data.price_per_night),
      currency: data.currency ?? "AMD",
    };
  } catch {
    return null;
  }
}

export async function loadTourSeo(slug: string): Promise<SeoItem | null> {
  try {
    const { data } = await supabase
      .from("tours")
      .select("name,description,seo_description,main_image_url,price,currency")
      .eq("slug", slug)
      .maybeSingle();
    if (!data) return null;
    return {
      name: data.name,
      description: clip(data.seo_description || data.description),
      image: data.main_image_url,
      price: Number(data.price),
      currency: data.currency ?? "AMD",
    };
  } catch {
    return null;
  }
}

export function itemHead(kind: "property" | "tour", slug: string, seo: SeoItem | null | undefined, fallbackTitle: string, fallbackDesc: string, ldOverride?: Record<string, unknown> | null) {
  const url = `${SITE}/${kind}/${slug}`;
  const title = seo ? `${seo.name} — StayLand` : fallbackTitle;
  const desc = seo?.description || fallbackDesc;
  const img = seo?.image && /^https:\/\//.test(seo.image) ? seo.image : null;
  const ld = ldOverride !== undefined ? ldOverride : seo
    ? kind === "property"
      ? { "@context": "https://schema.org", "@type": "LodgingBusiness", name: seo.name, description: desc, url, ...(img ? { image: img } : {}), address: { "@type": "PostalAddress", addressCountry: "AM" }, priceRange: `${seo.price} ${seo.currency}` }
      : { "@context": "https://schema.org", "@type": "Product", name: seo.name, description: desc, url, ...(img ? { image: img } : {}), offers: { "@type": "Offer", price: seo.price, priceCurrency: seo.currency, url, availability: "https://schema.org/InStock" } }
    : null;
  return {
    meta: [
      { title },
      { name: "description", content: desc },
      { property: "og:title", content: title },
      { property: "og:description", content: desc },
      { property: "og:type", content: "website" },
      { property: "og:url", content: url },
      { name: "twitter:card", content: "summary_large_image" },
      ...(img ? [{ property: "og:image", content: img }, { name: "twitter:image", content: img }] : []),
    ],
    links: [{ rel: "canonical", href: url }],
    scripts: ld ? [{ type: "application/ld+json", children: JSON.stringify(ld) }] : [],
  };
}

type PropRow = Record<string, unknown> & {
  name?: string | null; name_hy?: string | null; description?: string | null; description_hy?: string | null;
  main_image_url?: string | null; price_per_night?: number | string | null; currency?: string | null;
  property_images?: { image_url: string; is_cover: boolean | null; sort_order: number }[] | null;
  property_amenities?: { amenity_code: string }[] | null;
};
type RefRow = { cities?: { code: string; name_en: string }[]; regions?: { code: string; name_en: string }[]; amenities?: { code: string; name_en: string }[] } | null;

export function propertySeoFromData(prop: unknown): SeoItem | null {
  const d = prop as PropRow | null | undefined;
  if (!d) return null;
  return {
    name: (d.name_hy || d.name || "") as string,
    description: clip((d.description_hy || d.description) as string | null),
    image: (d.main_image_url as string | null) ?? null,
    price: Number(d.price_per_night),
    currency: (d.currency as string) ?? "AMD",
  };
}

const httpsOnly = (u: unknown): u is string => typeof u === "string" && /^https:\/\//.test(u);

/** LodgingBusiness JSON-LD built only from real listing fields; missing data is omitted, never invented. */
export function propertyLodgingLd(slug: string, prop: unknown, ref: unknown): Record<string, unknown> | null {
  const d = prop as PropRow | null | undefined;
  if (!d) return null;
  const r = ref as RefRow;
  const url = `${SITE}/property/${slug}`;
  const name = (d.name_hy || d.name) as string;
  const description = clip((d.description_hy || d.description) as string | null, 500);
  const images = [
    ...((d.property_images ?? []).slice().sort((a, b) => Number(b.is_cover) - Number(a.is_cover) || a.sort_order - b.sort_order).map((i) => i.image_url)),
    d.main_image_url,
  ].filter(httpsOnly);
  const uniqImages = Array.from(new Set(images)).slice(0, 10);
  const exact = d["show_exact_location"] === true;
  const city = r?.cities?.find((c) => c.code === d["city_code"])?.name_en;
  const region = r?.regions?.find((c) => c.code === d["region_code"])?.name_en;
  const street = exact && typeof d["address"] === "string" && d["address"].trim() ? (d["address"] as string).trim() : undefined;
  const lat = d["latitude"], lng = d["longitude"];
  const amenities = (d.property_amenities ?? [])
    .map((a) => r?.amenities?.find((x) => x.code === a.amenity_code)?.name_en)
    .filter((n): n is string => !!n)
    .map((n) => ({ "@type": "LocationFeatureSpecification", name: n, value: true }));
  const price = Number(d.price_per_night);
  const num = (k: string) => (typeof d[k] === "number" && (d[k] as number) > 0 ? (d[k] as number) : undefined);
  const ld: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    name,
    url,
    ...(description ? { description } : {}),
    ...(uniqImages.length ? { image: uniqImages } : {}),
    address: {
      "@type": "PostalAddress",
      addressCountry: "AM",
      ...(city ? { addressLocality: city } : {}),
      ...(region ? { addressRegion: region } : {}),
      ...(street ? { streetAddress: street } : {}),
    },
    ...(exact && typeof lat === "number" && typeof lng === "number" ? { geo: { "@type": "GeoCoordinates", latitude: lat, longitude: lng } } : {}),
    ...(amenities.length ? { amenityFeature: amenities } : {}),
    ...(num("max_guests") ? { maximumAttendeeCapacity: num("max_guests") } : {}),
    ...(num("bedrooms") ? { numberOfRooms: num("bedrooms") } : {}),
    ...(typeof d["check_in_time"] === "string" && d["check_in_time"] ? { checkinTime: d["check_in_time"] } : {}),
    ...(typeof d["check_out_time"] === "string" && d["check_out_time"] ? { checkoutTime: d["check_out_time"] } : {}),
    ...(price > 0 ? { priceRange: `from ${price} ${d.currency ?? "AMD"} per night` } : {}),
  };
  return ld;
}

type PkgLike = {
  id: string; title: string; description: string | null; check_in: string; check_out: string;
  price: number; currency: string; image_url: string | null; image_urls?: string[] | null;
  property?: { name: string; slug: string } | null;
};

export function packageHead(id: string, pkg: PkgLike | null) {
  const url = `${SITE}/package/${id}`;
  if (!pkg) {
    return {
      meta: [
        { title: "Ամանորյա փաթեթ — StayLand Հայաստան" },
        { name: "description", content: "Ամանորյա փաթեթի մանրամասները, գինը և ամրագրումը։" },
        { property: "og:title", content: "Ամանորյա փաթեթ — StayLand" },
        { property: "og:description", content: "Տոնական հանգիստ հյուրատներում՝ պատրաստի փաթեթներով։" },
        { property: "og:type", content: "website" },
        { property: "og:url", content: url },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  }
  const title = `${pkg.title} — Ամանորյա փաթեթ | StayLand`;
  const dates = `${pkg.check_in} – ${pkg.check_out}`;
  const price = Number(pkg.price);
  const base = clip(pkg.description, 120);
  const desc = clip(`${base ? `${base} ` : ""}${dates}${pkg.property?.name ? ` · ${pkg.property.name}` : ""}${price > 0 ? ` · ${price} ${pkg.currency}` : ""}`, 160);
  const images = Array.from(new Set([pkg.image_url, ...(pkg.image_urls ?? [])].filter(httpsOnly))).slice(0, 10);
  const img = images[0] ?? null;
  const ld: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: pkg.title,
    url,
    ...(pkg.description ? { description: clip(pkg.description, 500) } : {}),
    ...(images.length ? { image: images } : {}),
    brand: { "@type": "Brand", name: "StayLand" },
    ...(price > 0
      ? { offers: { "@type": "Offer", price, priceCurrency: pkg.currency, url, availability: "https://schema.org/InStock", validThrough: pkg.check_in } }
      : {}),
  };
  return {
    meta: [
      { title },
      { name: "description", content: desc },
      { property: "og:title", content: title },
      { property: "og:description", content: desc },
      { property: "og:type", content: "product" },
      { property: "og:url", content: url },
      { name: "twitter:card", content: "summary_large_image" },
      ...(img ? [{ property: "og:image", content: img }, { name: "twitter:image", content: img }] : []),
    ],
    links: [{ rel: "canonical", href: url }],
    scripts: [{ type: "application/ld+json", children: JSON.stringify(ld) }],
  };
}

export const SITE_LD = [
  { "@context": "https://schema.org", "@type": "Organization", name: "StayLand", url: `${SITE}/`, logo: `${SITE}/favicon.png` },
  { "@context": "https://schema.org", "@type": "WebSite", name: "StayLand", url: `${SITE}/`, inLanguage: "hy" },
];
