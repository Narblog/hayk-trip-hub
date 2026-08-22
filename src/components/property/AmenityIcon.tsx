import { ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const FALLBACK = "sparkles";

const Dynamic = lazy(async () => {
  const mod = await import("lucide-react/dynamic");
  const DynamicIcon = mod.DynamicIcon;
  return {
    default: ({ name, className }: { name: string; className?: string | undefined }) => (
      <DynamicIcon
        name={(name || FALLBACK) as never}
        className={className}
        fallback={() => <DynamicIcon name={FALLBACK as never} className={className} />}
      />
    ),
  };
});

export function AmenityIcon({ icon, className }: { icon?: string | null | undefined; className?: string }) {
  const name = (icon ?? "").trim() || FALLBACK;
  const placeholder = <span className={className} aria-hidden="true" />;
  return (
    <ClientOnly fallback={placeholder}>
      <Suspense fallback={placeholder}>
        <Dynamic name={name} className={className} />
      </Suspense>
    </ClientOnly>
  );
}
