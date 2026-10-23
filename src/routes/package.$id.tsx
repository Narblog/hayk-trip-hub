import { useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarCheck, CalendarDays, Check, Minus, Moon, Plus, TreePine, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState, ErrorState } from "@/components/common/states";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { PACKAGE_ICONS, createPackageBookingRequest, packageNights, packageQuery } from "@/lib/packages";

export const Route = createFileRoute("/package/$id")({
  loader: ({ params }) => {
    if (!params.id) throw notFound();
  },
  head: () => ({
    meta: [
      { title: "Ամանորյա փաթեթ — StayLand Հայաստան" },
      { name: "description", content: "Ամանորյա փաթեթի մանրամասները, գինը և ամրագրումը։" },
      { property: "og:title", content: "Ամանորյա փաթեթ — StayLand" },
      { property: "og:description", content: "Տոնական հանգիստ հյուրատներում՝ պատրաստի փաթեթներով։" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PackageDetailPage,
});

const MONTHS: Record<string, string[]> = {
  hy: ["հունվ", "փետր", "մարտ", "ապր", "մայ", "հուն", "հուլ", "օգոս", "սեպտ", "հոկտ", "նոյ", "դեկ"],
  ru: ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"],
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
};

function shortDate(iso: string, lang: string) {
  const [, m, d] = iso.split("-").map(Number);
  return `${d} ${(MONTHS[lang] ?? MONTHS["en"] ?? [])[(m ?? 1) - 1] ?? ""}`;
}

const ERRORS: Record<string, string> = {
  DATES_TAKEN: "book.errUnavailable",
  RATE_LIMIT: "book.errRate",
  DUPLICATE_REQUEST: "book.errDuplicate",
  TOO_MANY_GUESTS: "book.errGuests",
  INVALID_DATES: "book.errPast",
  INVALID_CONTACT: "book.errName",
  PACKAGE_UNAVAILABLE: "packages.unavailable",
  PROPERTY_UNAVAILABLE: "packages.unavailable",
};

function Stepper({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2">
      <span className="text-sm">{label}</span>
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="icon" className="size-9 rounded-full" disabled={value <= min} onClick={() => onChange(value - 1)} aria-label={`${label} -`}>
          <Minus className="size-4" />
        </Button>
        <span className="w-6 text-center text-sm font-semibold">{value}</span>
        <Button type="button" variant="outline" size="icon" className="size-9 rounded-full" disabled={value >= max} onClick={() => onChange(value + 1)} aria-label={`${label} +`}>
          <Plus className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function PackageDetailPage() {
  const { t, lang } = useI18n();
  const { id } = Route.useParams();
  const q = useQuery(packageQuery(id));

  if (q.isPending) {
    return (
      <div className="container-page py-8">
        <Skeleton className="h-72 w-full rounded-3xl sm:h-96" />
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (q.isError) {
    return (
      <div className="container-page py-12">
        <ErrorState message={t("error.friendly")} onRetry={() => q.refetch()} />
      </div>
    );
  }

  const p = q.data;
  if (!p) {
    return (
      <div className="container-page py-12">
        <EmptyState title={t("packages.unavailable")} />
      </div>
    );
  }

  const Icon = PACKAGE_ICONS[p.icon] ?? TreePine;
  const img = p.image_url || p.property?.main_image_url;
  const nights = packageNights(p);

  return (
    <div>
      <section className="relative overflow-hidden">
        {img ? (
          <img src={img} alt={p.title} fetchPriority="high" decoding="async" className="h-72 w-full object-cover sm:h-96" />
        ) : (
          <div className="h-72 w-full bg-muted sm:h-96" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/30 to-transparent" />
        <span className="absolute left-4 top-4 grid size-12 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg sm:left-8 sm:top-8">
          <Icon className="size-6" />
        </span>
        <div className="container-page absolute inset-x-0 bottom-0 pb-6 sm:pb-8">
          <h1 className="max-w-3xl break-words font-display text-2xl font-semibold text-background sm:text-4xl">{p.title}</h1>
          {p.property ? (
            <Link
              to="/property/$slug"
              params={{ slug: p.property.slug }}
              className="mt-1 inline-block text-sm text-background/85 underline-offset-4 hover:underline"
            >
              {p.property.name}
            </Link>
          ) : null}
        </div>
      </section>

      <div className="container-page grid gap-6 py-6 sm:py-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2 text-xs sm:text-sm">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5">
              <CalendarDays className="size-4" /> {shortDate(p.check_in, lang)} – {shortDate(p.check_out, lang)}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5">
              <Moon className="size-4" /> {nights} {t("packages.nights")}
            </span>
          </div>

          {p.description ? <p className="mt-5 break-words text-sm leading-relaxed text-muted-foreground sm:text-base">{p.description}</p> : null}

          {p.includes.length ? (
            <div className="mt-6">
              <h2 className="font-display text-lg font-semibold">{t("packages.includesTitle")}</h2>
              <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                {p.includes.map((x, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" /> <span className="break-words">{x}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <aside className="min-w-0">
          <PackageBookingCard packageId={p.id} price={Number(p.price)} currency={p.currency} nights={nights} />
        </aside>
      </div>
    </div>
  );
}

function PackageBookingCard({ packageId, price, currency, nights }: { packageId: string; price: number; currency: string; nights: number }) {
  const { t, lang } = useI18n();
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-center shadow-card">
        <div className="mx-auto grid size-14 place-items-center rounded-full bg-brand-soft text-brand">
          <CalendarCheck className="size-7" />
        </div>
        <h3 className="mt-4 font-display text-xl font-semibold">{t("book.success")}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{t("book.successBody")}</p>
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (name.trim().length < 2) return setError(t("book.errName"));
    if (phone.trim().length < 5) return setError(t("book.errPhone"));
    setSending(true);
    try {
      await createPackageBookingRequest({ packageId, adults, children, infants, name, phone, email, message });
      setDone(true);
    } catch (err) {
      const raw = err instanceof Error ? err.message : "";
      const key = Object.keys(ERRORS).find((k) => raw.includes(k));
      setError(t(key ? ERRORS[key]! : "book.errGeneric"));
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <p className="font-display text-2xl font-semibold">{formatPrice(price, currency, lang)}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        {nights} {t("packages.nights")} · {t("packages.fixedDates")}
      </p>

      <div className="mt-4 space-y-2">
        <Stepper label={t("book.adults")} value={adults} min={1} max={20} onChange={setAdults} />
        <Stepper label={t("book.children")} value={children} min={0} max={20} onChange={setChildren} />
        <Stepper label={t("book.infants")} value={infants} min={0} max={5} onChange={setInfants} />
      </div>

      <div className="mt-4 grid gap-3">
        <div className="grid grid-cols-2 gap-3">
          <Input placeholder={t("book.name")} value={name} onChange={(e) => setName(e.target.value)} maxLength={80} required />
          <Input placeholder={t("book.phone")} value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={30} required />
        </div>
        <Input type="email" placeholder={t("book.email")} value={email} onChange={(e) => setEmail(e.target.value)} maxLength={120} />
        <Textarea placeholder={t("book.message")} value={message} onChange={(e) => setMessage(e.target.value.slice(0, 300))} rows={3} />
      </div>

      <div className="mt-4 flex items-center justify-between rounded-xl bg-surface p-3 text-sm font-semibold">
        <span className="inline-flex items-center gap-1.5">
          <Users className="size-4 text-muted-foreground" />
          {t("book.total")}
        </span>
        <span>{formatPrice(price, currency, lang)}</span>
      </div>

      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}

      <Button type="submit" className="mt-4 h-12 w-full rounded-full" disabled={sending}>
        {sending ? t("book.sending") : t("book.submit")}
      </Button>
      <p className="mt-3 text-xs text-muted-foreground">{t("book.disclaimer")}</p>
    </form>
  );
}
