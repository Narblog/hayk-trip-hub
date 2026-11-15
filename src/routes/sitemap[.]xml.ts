import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

function urlTag(loc: string, changefreq: string, priority: string, lastmod?: string) {
  return `<url><loc>${loc}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}<changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const origin = "https://www.stayland.am";
        const staticPaths = ["/", "/search", "/packages", "/about", "/help", "/terms", "/privacy"];

        const [props, pkgs, pgs] = await Promise.all([
          supabase
            .from("properties")
            .select("slug,updated_at")
            .eq("status", "APPROVED")
            .eq("is_active", true)
            .eq("is_demo", false)
            .limit(5000),
          supabase.from("packages").select("id,updated_at").eq("is_active", true).limit(1000),
          supabase.from("pages").select("slug,updated_at").eq("is_published", true).limit(500),
        ]);
        if (props.error || pkgs.error || pgs.error) {
          return new Response("Sitemap temporarily unavailable", { status: 503, headers: { "retry-after": "300" } });
        }
        const properties = props.data ?? [];
        const packages = pkgs.data ?? [];
        const infoPages = pgs.data ?? [];
        const day = (v: unknown) => (v ? new Date(v as string).toISOString().slice(0, 10) : undefined);


        const body =
          `<?xml version="1.0" encoding="UTF-8"?>` +
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">` +
          staticPaths.map((p) => urlTag(`${origin}${p}`, "daily", p === "/" ? "1.0" : "0.8")).join("") +
          properties.map((p) => urlTag(`${origin}/property/${encodeURIComponent(p.slug)}`, "weekly", "0.7", day(p.updated_at))).join("") +
          infoPages.map((p) => urlTag(`${origin}/p/${encodeURIComponent(p.slug)}`, "monthly", "0.5", day(p.updated_at))).join("") +
          packages.map((p) => urlTag(`${origin}/package/${p.id}`, "weekly", "0.6", day(p.updated_at))).join("") +
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
