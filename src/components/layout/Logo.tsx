import { Link } from "@tanstack/react-router";

export function Logo({ inverted = false }: { inverted?: boolean }) {
  return (
    <Link to="/" className="group flex items-baseline gap-0.5" aria-label="StayLand home">
      <span
        className={`font-display text-[1.35rem] font-semibold leading-none tracking-tight ${
          inverted ? "text-primary-foreground" : "text-foreground"
        }`}
      >
        Stay
      </span>
      <span className="font-display text-[1.35rem] font-semibold leading-none tracking-tight text-brand">
        Land
      </span>
      <span className="ml-0.5 size-1.5 rounded-full bg-brand transition-transform group-hover:scale-125" />
    </Link>
  );
}
