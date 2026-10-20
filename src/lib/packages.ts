import { queryOptions } from "@tanstack/react-query";
import { Flame, Gift, Snowflake, Sparkles, Star, TreePine, type LucideIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const PACKAGE_ICONS: Record<string, LucideIcon> = {
  tree: TreePine,
  gift: Gift,
  snowflake: Snowflake,
  sparkles: Sparkles,
  flame: Flame,
  star: Star,
};

export type PackageRow = {
  id: string;
  title: string;
  description: string | null;
  icon: string;
  property_id: string | null;
  check_in: string;
  check_out: string;
  price: number;
  currency: string;
  includes: string[];
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
  property?: { name: string; slug: string; main_image_url: string | null; city_code: string | null } | null;
};

export type PackageInput = Omit<PackageRow, "id" | "property">;

export function packageNights(p: { check_in: string; check_out: string }) {
  const ms = new Date(`${p.check_out}T00:00:00Z`).getTime() - new Date(`${p.check_in}T00:00:00Z`).getTime();
  return Math.max(0, Math.round(ms / 86400000));
}

const SELECT = "*, property:properties(name, slug, main_image_url, city_code)";

export const packagesQuery = () =>
  queryOptions({
    queryKey: ["packages", "public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("packages")
        .select(SELECT)
        .eq("is_active", true)
        .order("sort_order")
        .order("check_in");
      if (error) throw error;
      return (data ?? []) as unknown as PackageRow[];
    },
  });

export const adminPackagesQuery = () =>
  queryOptions({
    queryKey: ["packages", "admin"],
    queryFn: async () => {
      const { data, error } = await supabase.from("packages").select(SELECT).order("sort_order").order("check_in");
      if (error) throw error;
      return (data ?? []) as unknown as PackageRow[];
    },
  });

export const packagePropertyOptionsQuery = () =>
  queryOptions({
    queryKey: ["packages", "property-options"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("id, name, slug")
        .eq("status", "APPROVED")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

export async function savePackage(id: string | null, input: PackageInput) {
  if (input.check_out <= input.check_in) throw new Error("check_out");
  const row = { ...input, price: Number(input.price) || 0 };
  const { error } = id
    ? await supabase.from("packages").update(row).eq("id", id)
    : await supabase.from("packages").insert(row);
  if (error) throw error;
}

export async function deletePackage(id: string) {
  const { error } = await supabase.from("packages").delete().eq("id", id);
  if (error) throw error;
}
