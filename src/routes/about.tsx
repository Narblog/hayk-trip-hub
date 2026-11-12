import { createFileRoute } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "StayLand-ի մասին — Հայկական կացարաններ և փորձառություններ" },
      { name: "description", content: "StayLand-ը կապում է ճանապարհորդներին Հայաստանի հյուրատների, տնակների, վիլաների և տեղական տուր օպերատորների հետ։" },
      { property: "og:title", content: "StayLand-ի մասին" },
      { property: "og:description", content: "Հայկական հյուրընկալություն՝ ներկայացված հենց տանտերերի կողմից։" },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://www.stayland.am/about" },
    ],
    links: [{ rel: "canonical", href: "https://www.stayland.am/about" }],
  }),
  component: AboutPage,
});

function AboutPage() {
  const { t, lang } = useI18n();
  const c = ABOUT[lang as keyof typeof ABOUT] ?? ABOUT.hy;
  return (
    <div className="container-page max-w-3xl py-16">
      <h1 className="font-display text-4xl font-semibold">{t("about.title")}</h1>
      <p className="mt-6 text-lg leading-relaxed text-muted-foreground">{t("hero.subtitle")}</p>
      <div className="mt-10 grid gap-6 sm:grid-cols-3">
        {[
          [t("home.trust1"), t("home.trust1sub")],
          [t("home.trust2"), t("home.trust2sub")],
          [t("home.trust3"), t("home.trust3sub")],
        ].map(([title, sub]) => (
          <div key={title} className="rounded-2xl border border-border bg-card p-5">
            <p className="font-display text-lg font-semibold">{title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{sub}</p>
          </div>
        ))}
      </div>
      <div className="mt-12 space-y-10">
        {c.map((sec) => (
          <section key={sec.h}>
            <h2 className="font-display text-2xl font-semibold">{sec.h}</h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">{sec.p}</p>
          </section>
        ))}
      </div>
    </div>
  );
}

const ABOUT = {
  hy: [
    { h: "Ճանապարհորդների համար", p: "StayLand-ում կարող եք գտնել հյուրատներ, տնակներ և վիլաներ ամբողջ Հայաստանում՝ ֆիլտրելով ըստ քաղաքի, գնի, ննջասենյակների և հարմարությունների։ Յուրաքանչյուր կացարանի էջում կան լուսանկարներ, զբաղվածության օրացույց, քարտեզ և տանտիրոջ կոնտակտները։ Ամրագրման հայտն ուղարկվում է անմիջապես տանտիրոջը, որը կապ է հաստատում ձեզ հետ՝ մանրամասները ճշտելու համար։" },
    { h: "Տանտերերի համար", p: "Տանտերերը կարող են ավելացնել իրենց կացարանը, վերբեռնել լուսանկարներ, սահմանել գներ, կառավարել օրացույցը և ստանալ ամրագրման հայտեր իրենց անձնական էջում։ Հայտերը կարելի է հաստատել կամ մերժել, իսկ վիճակագրությունը ցույց է տալիս դիտումներն ու եկամուտը։" },
    { h: "Տուրեր և ամանօրյա փաթեթներ", p: "Բացի կացարաններից՝ StayLand-ում ներկայացված են տեղական տուր օպերատորների տուրերը, ինչպես նաև հատուկ ամանօրյա փաթեթներ՝ ֆիքսված գնով, ներառված ծառայություններով և հյուրերի քանակով։" },
  ],
  en: [
    { h: "For travellers", p: "StayLand lists guesthouses, cottages and villas across Armenia, with filters for city, price, bedrooms and amenities. Each listing shows photos, an availability calendar, a map and host contacts. Your booking request goes straight to the host, who contacts you to confirm the details." },
    { h: "For hosts", p: "Hosts can list their place, upload photos, set prices, manage their calendar and receive booking requests in their own dashboard, where they can accept or decline requests and follow views and earnings." },
    { h: "Tours and New Year packages", p: "Besides stays, StayLand features tours from local operators and special New Year packages with a fixed price, listed inclusions and guest capacity." },
  ],
  ru: [
    { h: "Для путешественников", p: "На StayLand собраны гостевые дома, коттеджи и виллы по всей Армении с фильтрами по городу, цене, спальням и удобствам. На странице каждого жилья есть фото, календарь занятости, карта и контакты хозяина. Заявка на бронирование отправляется напрямую хозяину, который свяжется с вами для уточнения деталей." },
    { h: "Для хозяев", p: "Хозяева могут добавить жильё, загрузить фото, указать цены, вести календарь и получать заявки в личном кабинете, где их можно принять или отклонить, а также следить за просмотрами и доходом." },
    { h: "Туры и новогодние пакеты", p: "Кроме жилья, на StayLand представлены туры местных операторов и специальные новогодние пакеты с фиксированной ценой, включёнными услугами и количеством гостей." },
  ],
};