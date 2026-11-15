import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { ALL_LANGS, HREFLANG, langUrl, type UrlLang } from "@/lib/lang-url";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const filled = (v: unknown) => typeof v === "string" && v.trim().length > 0;

/** One <url> per available language, each listing every available language (incl. itself) + x-default. */
function entries(path: string, langs: UrlLang[], changefreq: string, priority: string, lastmod?: string) {
  const avail = ALL_LANGS.filter((l) => langs.includes(l));
  const alts = avail.length > 1
    ? avail.map((l) => `<xhtml:link rel="alternate" hreflang="${HREFLANG[l]}" href="${esc(langUrl(path, l))}"/>`).join("") +
      `<xhtml:link rel="alternate" hreflang="x-default" href="${esc(langUrl(path, avail.includes("hy") ? "hy" : avail[0]!))}"/>`
    : "";
  return avail
    .map((l) => `<url><loc>${esc(langUrl(path, l))}</loc>${alts}${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}<changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`)
    .join("");
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const staticPaths = ["/", "/search", "/packages", "/about", "/help", "/terms", "/privacy"];

        const [props, pkgs, pgs] = await Promise.all([
          supabase
            .from("properties")
            .select("slug,updated_at,name_ru,description_ru,name_en,description_en")
            .eq("status", "APPROVED")
            .eq("is_active", true)
            .eq("is_demo", false)
            .limit(5000),
          supabase.from("packages").select("id,updated_at").eq("is_active", true).limit(1000),
          supabase.from("pages").select("slug,updated_at,title_hy,content_hy,title_ru,content_ru,title_en,content_en").eq("is_published", true).limit(500),
        ]);
        if (props.error || pkgs.error || pgs.error) {
          return new Response("Sitemap temporarily unavailable", { status: 503, headers: { "retry-after": "300" } });
        }
        const day = (v: unknown) => (v ? new Date(v as string).toISOString().slice(0, 10) : undefined);

        const body =
          `<?xml version="1.0" encoding="UTF-8"?>` +
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">` +
          staticPaths.map((p) => entries(p, ALL_LANGS, "daily", p === "/" ? "1.0" : "0.8")).join("") +
          (props.data ?? []).map((p) => {
            const langs: UrlLang[] = ["hy", ...(["ru", "en"] as const).filter((l) => filled(p[`name_${l}`]) && filled(p[`description_${l}`]))];
            return entries(`/property/${encodeURIComponent(p.slug)}`, langs, "weekly", "0.7", day(p.updated_at));
          }).join("") +
          (pgs.data ?? []).map((p) => {
            const row = p as Record<string, unknown>;
            const langs = ALL_LANGS.filter((l) => filled(row[`title_${l}`]) && filled(row[`content_${l}`]));
            return entries(`/p/${encodeURIComponent(p.slug)}`, langs, "monthly", "0.5", day(p.updated_at));
          }).join("") +
          // Package text is single-language, so only the Armenian URL is listed.
          (pkgs.data ?? []).map((p) => entries(`/package/${p.id}`, ["hy"], "weekly", "0.6", day(p.updated_at))).join("") +
          `</urlset>`;

        return new Response(body, {
          headers: {
            "content-type": "application/xml; charset=utf-8",
            "cache-control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
