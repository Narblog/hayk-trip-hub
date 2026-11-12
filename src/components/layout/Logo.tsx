import { Link } from "@tanstack/react-router";
import logoAsset from "@/assets/stayland-logo.png.asset.json";

export function Logo({ inverted = false, className = "h-9" }: { inverted?: boolean; className?: string }) {
  return (
    <Link to="/" className="group flex items-center" aria-label="StayLand home">
      <img
        src={logoAsset.url}
        alt="StayLand"
        className={`${className} w-auto bg-transparent transition-opacity group-hover:opacity-80 ${inverted ? "brightness-0 invert" : ""}`}
      />
    </Link>
  );
}
