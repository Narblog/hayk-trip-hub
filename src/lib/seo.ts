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

export function itemHead(kind: "property" | "tour", slug: string, seo: SeoItem | null | undefined, fallbackTitle: string, fallbackDesc: string) {
  const url = `${SITE}/${kind}/${slug}`;
  const title = seo ? `${seo.name} — StayLand` : fallbackTitle;
  const desc = seo?.description || fallbackDesc;
  const img = seo?.image && /^https:\/\//.test(seo.image) ? seo.image : null;
  const ld = seo
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
