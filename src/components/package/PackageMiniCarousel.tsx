import { Link } from "@tanstack/react-router";
import { CalendarDays, ChevronLeft, ChevronRight, TreePine, Users } from "lucide-react";
import { useRef } from "react";
import { shortPackageDate } from "@/components/package/PackageCard";
import { useI18n } from "@/lib/i18n";
import { guestRange, PACKAGE_ICONS, type PackageRow } from "@/lib/packages";

export function PackageMiniCarousel({ items }: { items: PackageRow[] }) {
  const { t, lang } = useI18n();
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: "smooth" });

  return (
    <div className="relative mt-5">
      <div ref={ref} className="flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((p) => {
          const Icon = PACKAGE_ICONS[p.icon] ?? TreePine;
          const img = p.image_url || p.property?.main_image_url;
          const guests = guestRange(p);
          return (
            <Link
              key={p.id}
              to="/package/$id"
              params={{ id: p.id }}
              className="group relative block aspect-[4/5] w-[44%] shrink-0 snap-start overflow-hidden rounded-2xl bg-muted shadow-card sm:w-[30%] lg:w-[calc((100%-3*0.75rem)/4.3)]"
            >
              {img ? <img src={img} alt={p.title} loading="lazy" className="h-full w-full object-cover transition group-hover:scale-105" /> : null}
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/10 to-transparent" />
              <span className="absolute left-2 top-2 grid size-8 place-items-center rounded-full bg-primary text-primary-foreground">
                <Icon className="size-4" />
              </span>
              <div className="absolute inset-x-0 bottom-0 space-y-1 p-2.5 text-background sm:p-3">
                <p className="line-clamp-2 text-sm font-semibold leading-tight sm:text-base">{p.title}</p>
                <p className="flex items-center gap-1 text-xs"><CalendarDays className="size-3.5 shrink-0" /> {shortPackageDate(p.check_in, lang)} – {shortPackageDate(p.check_out, lang)}</p>
                {guests ? <p className="flex items-center gap-1 text-xs"><Users className="size-3.5 shrink-0" /> {guests} {t("packages.guests")}</p> : null}
              </div>
            </Link>
          );
        })}
      </div>
      {items.length > 4 ? (
        <>
          <button type="button" aria-label="prev" onClick={() => scroll(-1)} className="absolute -left-3 top-1/2 hidden size-9 -translate-y-1/2 place-items-center rounded-full border border-border bg-background shadow-card lg:grid"><ChevronLeft className="size-4" /></button>
          <button type="button" aria-label="next" onClick={() => scroll(1)} className="absolute -right-3 top-1/2 hidden size-9 -translate-y-1/2 place-items-center rounded-full border border-border bg-background shadow-card lg:grid"><ChevronRight className="size-4" /></button>
        </>
      ) : null}
    </div>
  );
}
