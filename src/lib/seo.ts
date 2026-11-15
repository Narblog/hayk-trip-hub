import { supabase } from "@/integrations/supabase/client";

import { HREFLANG, langLinks, langMeta, langUrl, SITE, type UrlLang } from "@/lib/lang-url";
export { SITE };

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

export function itemHead(kind: "property" | "tour", slug: string, seo: SeoItem | null | undefined, fallbackTitle: string, fallbackDesc: string, ldOverride?: Record<string, unknown> | null, lang: UrlLang = "hy", available: UrlLang[] = ["hy"]) {
  const path = `/${kind}/${slug}`;
  const url = langUrl(path, lang);
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
      { name: "twitter:card", content: "summary_large_image" },
      ...langMeta(path, lang, available),
      ...(img ? [{ property: "og:image", content: img }, { name: "twitter:image", content: img }] : []),
    ],
    links: langLinks(path, lang, available),
    scripts: ld ? [{ type: "application/ld+json", children: JSON.stringify(ld) }] : [],
  };
}

type PropRow = Record<string, unknown> & {
  name?: string | null; name_hy?: string | null; description?: string | null; description_hy?: string | null;
  main_image_url?: string | null; price_per_night?: number | string | null; currency?: string | null;
  property_images?: { image_url: string; is_cover: boolean | null; sort_order: number }[] | null;
  property_amenities?: { amenity_code: string }[] | null;
};
type RefItem = Record<string, unknown> & { code: string };
type RefRow = { cities?: RefItem[]; regions?: RefItem[]; amenities?: RefItem[] } | null;

const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : "");

/** Languages with a real translated name + description. Armenian is always available (falls back to the base fields). */
export function propertyLangs(prop: unknown): UrlLang[] {
  const d = prop as Record<string, unknown> | null | undefined;
  if (!d) return ["hy"];
  return (["hy", "ru", "en"] as UrlLang[]).filter((l) => l === "hy" || (str(d[`name_${l}`]) && str(d[`description_${l}`])));
}

function propText(d: Record<string, unknown>, base: "name" | "description", lang: UrlLang) {
  const own = str(d[`${base}_${lang}`]);
  if (own) return own;
  return str(d[`${base}_hy`]) || str(d[base]);
}

export function propertySeoFromData(prop: unknown, lang: UrlLang = "hy"): SeoItem | null {
  const d = prop as PropRow | null | undefined;
  if (!d) return null;
  return {
    name: propText(d, "name", lang),
    description: clip(propText(d, "description", lang)),
    image: (d.main_image_url as string | null) ?? null,
    price: Number(d.price_per_night),
    currency: (d.currency as string) ?? "AMD",
  };
}

const httpsOnly = (u: unknown): u is string => typeof u === "string" && /^https:\/\//.test(u);

/** LodgingBusiness JSON-LD built only from real listing fields; missing data is omitted, never invented. */
export function propertyLodgingLd(slug: string, prop: unknown, ref: unknown, lang: UrlLang = "hy"): Record<string, unknown> | null {
  const d = prop as PropRow | null | undefined;
  if (!d) return null;
  const r = ref as RefRow;
  const url = langUrl(`/property/${slug}`, lang);
  const name = propText(d, "name", lang);
  const description = clip(propText(d, "description", lang), 500);
  const nm = (x: Record<string, unknown> | undefined) => (x ? str(x[`name_${lang}`]) || str(x["name_en"]) : "") || undefined;
  const images = [
    ...((d.property_images ?? []).slice().sort((a, b) => Number(b.is_cover) - Number(a.is_cover) || a.sort_order - b.sort_order).map((i) => i.image_url)),
    d.main_image_url,
  ].filter(httpsOnly);
  const uniqImages = Array.from(new Set(images)).slice(0, 10);
  const exact = d["show_exact_location"] === true;
  const city = nm(r?.cities?.find((c) => c.code === d["city_code"]));
  const region = nm(r?.regions?.find((c) => c.code === d["region_code"]));
  const street = exact && typeof d["address"] === "string" && d["address"].trim() ? (d["address"] as string).trim() : undefined;
  const lat = d["latitude"], lng = d["longitude"];
  const amenities = (d.property_amenities ?? [])
    .map((a) => nm(r?.amenities?.find((x) => x.code === a.amenity_code)))
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
    inLanguage: HREFLANG[lang],
    ...(price > 0 ? { priceRange: `from ${price} ${d.currency ?? "AMD"} per night` } : {}),
  };
  return ld;
}

type PkgLike = {
  id: string; title: string; description: string | null; check_in: string; check_out: string;
  price: number; currency: string; image_url: string | null; image_urls?: string[] | null;
  property?: { name: string; slug: string } | null;
};

// Package titles/descriptions exist only in one language, so only the Armenian URL is indexable.
export function packageHead(id: string, pkg: PkgLike | null, lang: UrlLang = "hy") {
  const path = `/package/${id}`;
  const url = langUrl(path, lang);
  const seoLinks = langLinks(path, lang, ["hy"]);
  const seoMeta = langMeta(path, lang, ["hy"]);
  if (!pkg) {
    return {
      meta: [
        { title: "Ամանորյա փաթեթ — StayLand Հայաստան" },
        { name: "description", content: "Ամանորյա փաթեթի մանրամասները, գինը և ամրագրումը։" },
        { property: "og:title", content: "Ամանորյա փաթեթ — StayLand" },
        { property: "og:description", content: "Տոնական հանգիստ հյուրատներում՝ պատրաստի փաթեթներով։" },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        ...seoMeta,
      ],
      links: seoLinks,
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
      { name: "twitter:card", content: "summary_large_image" },
      ...seoMeta,
      ...(img ? [{ property: "og:image", content: img }, { name: "twitter:image", content: img }] : []),
    ],
    links: seoLinks,
    scripts: [{ type: "application/ld+json", children: JSON.stringify(ld) }],
  };
}

export function siteLd(lang: UrlLang = "hy") {
  const url = langUrl("/", lang);
  return [
    { "@context": "https://schema.org", "@type": "Organization", name: "StayLand", url: `${SITE}/`, logo: `${SITE}/favicon.png` },
    { "@context": "https://schema.org", "@type": "WebSite", name: "StayLand", url, inLanguage: HREFLANG[lang] },
  ];
}
