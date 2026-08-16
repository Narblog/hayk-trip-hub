import { DynamicIcon, type IconName } from "lucide-react/dynamic";

const FALLBACK: IconName = "sparkles";

export function AmenityIcon({ icon, className }: { icon?: string | null | undefined; className?: string }) {
  const name = (icon ?? "").trim() as IconName;
  return <DynamicIcon name={name || FALLBACK} fallback={() => <DynamicIcon name={FALLBACK} className={className} />} className={className} />;
}
