import {
  Camera,
  CarFront,
  ChefHat,
  Church,
  Fish,
  Footprints,
  Landmark,
  Mountain,
  Tent,
  Utensils,
  Waves,
  Wine,
  type LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  footprints: Footprints,
  wine: Wine,
  "car-front": CarFront,
  landmark: Landmark,
  camera: Camera,
  fish: Fish,
  waves: Waves,
  tent: Tent,
  "chef-hat": ChefHat,
  utensils: Utensils,
  church: Church,
  rabbit: Mountain,
};

export function tourCategoryIcon(icon?: string | null): LucideIcon {
  if (!icon) return Mountain;
  return ICON_MAP[icon] ?? Mountain;
}
