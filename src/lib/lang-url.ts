// Language lives in the URL: "/" = Armenian (default), "/ru/..." and "/en/...".
// Internally the router sees the unprefixed path plus a `lang` search param,
// so every existing route serves all three languages without duplicate route files.
export type UrlLang = "hy" | "ru" | "en";
export const SITE = "https://www.stayland.am";
export const ALL_LANGS: UrlLang[] = ["hy", "ru", "en"];
export const HREFLANG: Record<UrlLang, string> = { hy: "hy-AM", ru: "ru", en: "en" };
export const OG_LOCALE: Record<UrlLang, string> = { hy: "hy_AM", ru: "ru_RU", en: "en_US" };

const PREFIX_RE = /^\/(ru|en)(?=\/|$)/;

export function langFromSearch(search: unknown): UrlLang {
  const l = (search as { lang?: unknown } | null | undefined)?.lang;
  return l === "ru" || l === "en" ? l : "hy";
}

/** Public path for a language: ("/property/x","ru") -> "/ru/property/x"; ("/","en") -> "/en/". */
export function langPath(path: string, lang: UrlLang): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  if (lang === "hy") return p;
  return p === "/" ? `/${lang}/` : `/${lang}${p}`;
}

export const langUrl = (path: string, lang: UrlLang) => `${SITE}${langPath(path, lang)}`;

/** Strip a /ru or /en prefix from a browser pathname. */
export function splitLangPath(pathname: string): { lang: UrlLang; path: string } {
  const m = pathname.match(PREFIX_RE);
  if (!m) return { lang: "hy", path: pathname || "/" };
  return { lang: m[1] as UrlLang, path: pathname.slice(m[0].length) || "/" };
}

export const langRewrite = {
  input: ({ url }: { url: URL }) => {
    const { lang, path } = splitLangPath(url.pathname);
    if (lang === "hy") return undefined;
    url.pathname = path;
    url.searchParams.set("lang", lang);
    return url;
  },
  output: ({ url }: { url: URL }) => {
    const l = url.searchParams.get("lang");
    if (l !== "ru" && l !== "en") {
      if (url.searchParams.has("lang")) { url.searchParams.delete("lang"); return url; }
      return undefined;
    }
    url.searchParams.delete("lang");
    url.pathname = langPath(url.pathname, l);
    return url;
  },
};

/**
 * Canonical (self) + hreflang alternates. `available` lists the languages that have
 * real content for this page. When the current language is not available the page is
 * marked noindex and is left out of the alternates.
 */
export function langLinks(path: string, lang: UrlLang, available: UrlLang[] = ALL_LANGS) {
  const avail = ALL_LANGS.filter((l) => available.includes(l));
  const links: { rel: string; href: string; hrefLang?: string }[] = [{ rel: "canonical", href: langUrl(path, lang) }];
  if (avail.length > 1 || (avail.length === 1 && avail[0] !== lang)) {
    for (const l of avail) links.push({ rel: "alternate", hrefLang: HREFLANG[l], href: langUrl(path, l) });
    const def = avail.includes("hy") ? "hy" : avail[0]!;
    links.push({ rel: "alternate", hrefLang: "x-default", href: langUrl(path, def) });
  }
  return links;
}

export function langMeta(path: string, lang: UrlLang, available: UrlLang[] = ALL_LANGS) {
  return [
    { property: "og:url", content: langUrl(path, lang) },
    { property: "og:locale", content: OG_LOCALE[lang] },
    ...ALL_LANGS.filter((l) => l !== lang && available.includes(l)).map((l) => ({ property: "og:locale:alternate", content: OG_LOCALE[l] })),
    ...(available.includes(lang) ? [] : [{ name: "robots", content: "noindex, follow" }]),
  ];
}
