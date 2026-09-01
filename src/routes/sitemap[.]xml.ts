import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

function urlTag(loc: string, changefreq: string, priority: string, lastmod?: string) {
  return `<url><loc>${loc}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}<changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const origin = new URL(request.url).origin;
        const staticPaths = ["/", "/search", "/tours", "/destinations", "/about", "/help", "/terms", "/privacy"];

        const [{ data: properties }, { data: tours }, { data: pages }] = await Promise.all([
          supabase.from("properties").select("slug,updated_at").eq("status", "APPROVED").limit(2000),
          supabase.from("tours").select("slug,updated_at").eq("status", "APPROVED").limit(2000),
          supabase.from("pages").select("slug,updated_at").eq("is_published", true).limit(500),
        ]);


        const body =
          `<?xml version="1.0" encoding="UTF-8"?>` +
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">` +
          staticPaths.map((p) => urlTag(`${origin}${p}`, "daily", p === "/" ? "1.0" : "0.8")).join("") +
          (properties ?? [])
            .map((p) =>
              urlTag(
                `${origin}/property/${p.slug}`,
                "weekly",
                "0.7",
                p.updated_at ? new Date(p.updated_at as string).toISOString().slice(0, 10) : undefined,
              ),
            )
            .join("") +
          (tours ?? [])
            .map((tour) =>
              urlTag(
                `${origin}/tour/${tour.slug}`,
                "weekly",
                "0.6",
                tour.updated_at ? new Date(tour.updated_at as string).toISOString().slice(0, 10) : undefined,
              ),
            )
            .join("") +
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
