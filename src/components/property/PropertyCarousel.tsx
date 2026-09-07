import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PropertyCard, type PropertyCardData } from "./PropertyCard";

export function PropertyCarousel({ items }: { items: PropertyCardData[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const [active, setActive] = useState(0);

  const measure = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setCanPrev(el.scrollLeft > 8);
    setCanNext(el.scrollLeft < max - 8);
    const first = el.firstElementChild as HTMLElement | null;
    const step = first ? first.offsetWidth + 16 : 1;
    setActive(Math.min(items.length - 1, Math.max(0, Math.round(el.scrollLeft / step))));
  }, [items.length]);

  useEffect(() => {
    measure();
    const el = trackRef.current;
    if (!el) return;
    const onResize = () => measure();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [measure]);

  const scrollByCard = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    const first = el.firstElementChild as HTMLElement | null;
    const step = first ? first.offsetWidth + 16 : el.clientWidth;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  // mouse drag support (desktop)
  const drag = useRef({ active: false, moved: false, startX: 0, startLeft: 0 });

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    const el = trackRef.current;
    if (!el) return;
    drag.current = { active: true, moved: false, startX: e.clientX, startLeft: el.scrollLeft };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const el = trackRef.current;
    if (!el || !drag.current.active) return;
    const dx = e.clientX - drag.current.startX;
    if (Math.abs(dx) > 4) drag.current.moved = true;
    el.scrollLeft = drag.current.startLeft - dx;
  };

  const endDrag = () => {
    drag.current.active = false;
  };

  const onClickCapture = (e: React.MouseEvent) => {
    if (drag.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      drag.current.moved = false;
    }
  };

  if (!items.length) return null;

  return (
    <div className="relative">
      <div
        ref={trackRef}
        onScroll={measure}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        onClickCapture={onClickCapture}
        className="scrollbar-none -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0"
      >
        {items.map((p) => (
          <div
            key={p.id}
            className="w-[82%] shrink-0 snap-start sm:w-[calc((100%-1rem)/2)] lg:w-[calc((100%-3rem)/4)]"
          >
            <PropertyCard p={p} compact />
          </div>
        ))}
      </div>

      {canPrev ? (
        <button
          type="button"
          aria-label="Previous"
          onClick={() => scrollByCard(-1)}
          className="absolute -left-4 top-[38%] hidden size-10 items-center justify-center rounded-full border border-border bg-card shadow-lift transition-colors hover:border-brand hover:text-brand sm:flex"
        >
          <ChevronLeft className="size-5" />
        </button>
      ) : null}
      {canNext ? (
        <button
          type="button"
          aria-label="Next"
          onClick={() => scrollByCard(1)}
          className="absolute -right-4 top-[38%] hidden size-10 items-center justify-center rounded-full border border-border bg-card shadow-lift transition-colors hover:border-brand hover:text-brand sm:flex"
        >
          <ChevronRight className="size-5" />
        </button>
      ) : null}

      <div className="mt-4 flex items-center justify-center gap-1.5 sm:hidden">
        {items.map((p, i) => (
          <span
            key={p.id}
            className={`h-1.5 rounded-full transition-all ${
              i === active ? "w-5 bg-brand" : "w-1.5 bg-border"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
