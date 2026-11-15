import { ALL_LANGS, langLinks, langMeta, langFromSearch, type UrlLang } from "@/lib/lang-url";

type Txt = { title: string; desc: string; ogTitle: string; ogDesc: string };
type Entry = { path: string; type: "website" | "article"; card: "summary" | "summary_large_image"; noindex?: boolean; t: Record<UrlLang, Txt> };

export const STATIC_SEO = {
  home: { path: "/", type: "website", card: "summary_large_image", t: {
    hy: { title: "StayLand — Գտիր քո իդեալական հանգիստը Հայաստանում", desc: "Բացահայտիր Հայաստանի լավագույն հյուրատները, տնակներն ու անմոռանալի փորձառությունները։ Կապվիր տանտիրոջ հետ ուղիղ՝ առանց միջնորդավճարի։", ogTitle: "StayLand — Կացարաններ և փորձառություններ Հայաստանում", ogDesc: "Հյուրատներ, տնակներ և տուրեր ամբողջ Հայաստանում։ Կապվիր տանտիրոջ հետ ուղիղ։" },
    ru: { title: "StayLand — Найдите идеальный отдых в Армении", desc: "Лучшие гостевые дома, домики и незабываемые впечатления в Армении. Связывайтесь с хозяином напрямую, без комиссии.", ogTitle: "StayLand — Жильё и впечатления в Армении", ogDesc: "Гостевые дома, домики и туры по всей Армении. Связывайтесь с хозяином напрямую." },
    en: { title: "StayLand — Find your perfect stay in Armenia", desc: "Discover Armenia's best guesthouses, cabins and unforgettable experiences. Contact hosts directly, with no commission.", ogTitle: "StayLand — Stays and experiences in Armenia", ogDesc: "Guesthouses, cabins and tours across Armenia. Contact hosts directly." },
  } },
  search: { path: "/search", type: "website", card: "summary_large_image", t: {
    hy: { title: "Փնտրել կացարան Հայաստանում — StayLand", desc: "Փնտրեք հյուրատներ, տնակներ, քոթեջներ և բնակարաններ ամբողջ Հայաստանում՝ ըստ ամսաթվերի, հյուրերի, գնի և հարմարությունների։", ogTitle: "Փնտրել կացարան Հայաստանում — StayLand", ogDesc: "Գտեք ազատ կացարաններ ամբողջ Հայաստանում և կապվեք տանտերերի հետ ուղիղ։" },
    ru: { title: "Поиск жилья в Армении — StayLand", desc: "Ищите гостевые дома, домики, коттеджи и квартиры по всей Армении по датам, числу гостей, цене и удобствам.", ogTitle: "Поиск жилья в Армении — StayLand", ogDesc: "Находите свободное жильё по всей Армении и связывайтесь с хозяевами напрямую." },
    en: { title: "Search stays in Armenia — StayLand", desc: "Search guesthouses, cabins, cottages and apartments across Armenia by dates, guests, price and amenities.", ogTitle: "Search stays in Armenia — StayLand", ogDesc: "Find available stays across Armenia and contact hosts directly." },
  } },
  about: { path: "/about", type: "website", card: "summary", t: {
    hy: { title: "StayLand-ի մասին — Հայկական կացարաններ և փորձառություններ", desc: "StayLand-ը կապում է ճանապարհորդներին Հայաստանի հյուրատների, տնակների, վիլաների և տեղական տուր օպերատորների հետ։", ogTitle: "StayLand-ի մասին", ogDesc: "Հայկական հյուրընկալություն՝ ներկայացված հենց տանտերերի կողմից։" },
    ru: { title: "О StayLand — жильё и впечатления в Армении", desc: "StayLand соединяет путешественников с гостевыми домами, домиками, виллами и местными туроператорами Армении.", ogTitle: "О StayLand", ogDesc: "Армянское гостеприимство от самих хозяев." },
    en: { title: "About StayLand — Armenian stays and experiences", desc: "StayLand connects travellers with Armenia's guesthouses, cabins, villas and local tour operators.", ogTitle: "About StayLand", ogDesc: "Armenian hospitality, presented by the hosts themselves." },
  } },
  packages: { path: "/packages", type: "website", card: "summary_large_image", t: {
    hy: { title: "Ամանորյա փաթեթներ — StayLand Հայաստան", desc: "Ամանորյա և տոնական փաթեթներ Հայաստանի լավագույն հյուրատներում՝ ամսաթվերով, գներով և ներառված ծառայություններով։", ogTitle: "Ամանորյա փաթեթներ — StayLand", ogDesc: "Տոնական հանգիստ հյուրատներում՝ պատրաստի փաթեթներով։" },
    ru: { title: "Новогодние пакеты — StayLand Армения", desc: "Новогодние и праздничные пакеты в лучших гостевых домах Армении — с датами, ценами и включёнными услугами.", ogTitle: "Новогодние пакеты — StayLand", ogDesc: "Праздничный отдых в гостевых домах с готовыми пакетами." },
    en: { title: "New Year packages — StayLand Armenia", desc: "New Year and holiday packages at Armenia's best guesthouses, with dates, prices and included services.", ogTitle: "New Year packages — StayLand", ogDesc: "Holiday getaways at guesthouses with ready-made packages." },
  } },
  help: { path: "/help", type: "website", card: "summary", t: {
    hy: { title: "Օգնություն և կապ — StayLand Հայաստան", desc: "Օգնություն կացարանի, հայտարարության կամ StayLand հաշվի վերաբերյալ։ Ճանապարհորդները կապվում են տանտերերի հետ ուղիղ, տանտերերը հրապարակում են անվճար։", ogTitle: "StayLand օգնություն և կապ", ogDesc: "Աջակցություն ճանապարհորդներին և տանտերերին StayLand Հայաստանում։" },
    ru: { title: "Помощь и контакты — StayLand Армения", desc: "Помощь по жилью, объявлению или аккаунту StayLand. Путешественники связываются с хозяевами напрямую, хозяева публикуют бесплатно.", ogTitle: "Помощь и контакты StayLand", ogDesc: "Поддержка путешественников и хозяев на StayLand Армения." },
    en: { title: "Help and contact — StayLand Armenia", desc: "Help with a stay, a listing or your StayLand account. Travellers contact hosts directly, hosts list for free.", ogTitle: "StayLand help and contact", ogDesc: "Support for travellers and hosts on StayLand Armenia." },
  } },
  privacy: { path: "/privacy", type: "article", card: "summary", t: {
    hy: { title: "Գաղտնիության քաղաքականություն — StayLand Հայաստան", desc: "Ինչ տվյալներ է հավաքում StayLand-ը, ինչպես են աշխատում անանուն վիճակագրությունները և ինչպես են օգտատերերը կառավարում իրենց տվյալները։", ogTitle: "StayLand գաղտնիության քաղաքականություն", ogDesc: "Նվազագույն տվյալներ, անանուն վիճակագրություն, անձնական տվյալների չվաճառք։" },
    ru: { title: "Политика конфиденциальности — StayLand Армения", desc: "Какие данные собирает StayLand, как работает анонимная статистика и как пользователи управляют своими данными.", ogTitle: "Политика конфиденциальности StayLand", ogDesc: "Минимум данных, анонимная статистика, никакой продажи личных данных." },
    en: { title: "Privacy policy — StayLand Armenia", desc: "What data StayLand collects, how anonymous statistics work and how users control their data.", ogTitle: "StayLand privacy policy", ogDesc: "Minimal data, anonymous statistics, no selling of personal data." },
  } },
  terms: { path: "/terms", type: "article", card: "summary", t: {
    hy: { title: "Օգտագործման պայմաններ — StayLand Հայաստան", desc: "Ինչպես է աշխատում StayLand-ը՝ հայտարարություններ, տանտերեր, կարծիքներ և վճարումներ։ StayLand-ը չի գանձում ամրագրման միջնորդավճար։", ogTitle: "StayLand օգտագործման պայմաններ", ogDesc: "Կանոններ հյուրերի և տանտերերի համար StayLand Հայաստան հարթակում։" },
    ru: { title: "Условия использования — StayLand Армения", desc: "Как работает StayLand: объявления, хозяева, отзывы и оплата. StayLand не берёт комиссию за бронирование.", ogTitle: "Условия использования StayLand", ogDesc: "Правила для гостей и хозяев на платформе StayLand Армения." },
    en: { title: "Terms of use — StayLand Armenia", desc: "How StayLand works: listings, hosts, reviews and payments. StayLand charges no booking commission.", ogTitle: "StayLand terms of use", ogDesc: "Rules for guests and hosts on the StayLand Armenia platform." },
  } },
  tours: { path: "/tours", type: "website", card: "summary_large_image", noindex: true, t: {
    hy: { title: "Տուրեր և փորձառություններ Հայաստանում — StayLand", desc: "Օրվա տուրեր, արշավներ, գինու երթուղիներ և մշակութային փորձառություններ տեղական հայ գիդերի ուղեկցությամբ։", ogTitle: "Տուրեր և փորձառություններ Հայաստանում", ogDesc: "Ամրագրեք հայկական տուրեր տեղական գիդերի ուղեկցությամբ։" },
    ru: { title: "Туры и впечатления в Армении — StayLand", desc: "Однодневные туры, походы, винные маршруты и культурные впечатления с местными гидами.", ogTitle: "Туры и впечатления в Армении", ogDesc: "Армянские туры с местными гидами." },
    en: { title: "Tours and experiences in Armenia — StayLand", desc: "Day tours, hikes, wine routes and cultural experiences with local Armenian guides.", ogTitle: "Tours and experiences in Armenia", ogDesc: "Armenian tours with local guides." },
  } },
} satisfies Record<string, Entry>;

export function staticHead(key: keyof typeof STATIC_SEO, search: unknown) {
  const e: Entry = STATIC_SEO[key];
  const lang = langFromSearch(search);
  const x = e.t[lang];
  return {
    meta: [
      ...(e.noindex ? [{ name: "robots", content: "noindex, follow" }] : []),
      { title: x.title },
      { name: "description", content: x.desc },
      { property: "og:title", content: x.ogTitle },
      { property: "og:description", content: x.ogDesc },
      { property: "og:type", content: e.type },
      { name: "twitter:card", content: e.card },
      ...langMeta(e.path, lang, ALL_LANGS),
    ],
    links: langLinks(e.path, lang, ALL_LANGS),
  };
}
