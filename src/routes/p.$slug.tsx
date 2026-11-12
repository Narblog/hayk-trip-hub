import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { pageQuery } from "@/lib/data";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/p/$slug")({
  loader: async ({ params }) => {
    try {
      const { data } = await supabase.from("pages").select("title_hy,content_hy").eq("slug", params.slug).maybeSingle();
      return { page: data ?? null };
    } catch {
      return { page: null };
    }
  },
  head: ({ params, loaderData }) => {
    const title = loaderData?.page?.title_hy ? `${loaderData.page.title_hy} — StayLand` : `${params.slug.replace(/-/g, " ")} — StayLand`;
    const desc =
      (loaderData?.page?.content_hy ?? "").replace(/\s+/g, " ").trim().slice(0, 158) ||
      "StayLand-ի տեղեկատվական էջ ճանապարհորդների և տանտերերի համար։";
    const url = `https://www.stayland.am/p/${params.slug}`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        { name: "twitter:card", content: "summary" },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  component: DynamicPage,
});

function DynamicPage() {
  const { slug } = Route.useParams();
  const { t, localized, lang } = useI18n();
  const { data, isPending } = useQuery(pageQuery(slug));

  if (isPending) {
    return <div className="container-page py-16 text-sm text-muted-foreground">{t("common.loading")}</div>;
  }
  if (!data) {
    return <div className="container-page py-16 text-center text-muted-foreground">{t("cms.notFound")}</div>;
  }

  const content =
    (lang === "hy" ? data.content_hy : lang === "ru" ? data.content_ru : data.content_en) || data.content_hy;
  const paragraphs = content.split(/\n{2,}/).filter(Boolean);

  return (
    <div className="container-page max-w-3xl py-16">
      <p className="eyebrow text-brand">StayLand.am</p>
      <h1 className="mt-2 font-display text-4xl">{localized(data, "title")}</h1>
      <div className="mt-8 space-y-5">
        {paragraphs.map((p, i) => (
          <p key={i} className="whitespace-pre-line text-base leading-relaxed text-muted-foreground">
            {p}
          </p>
        ))}
      </div>
    </div>
  );
}
