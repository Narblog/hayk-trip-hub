import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { getGuestFavoriteIds, toggleFavorite, toggleGuestFavorite } from "@/lib/data";

export function FavoriteButton({ propertyId, className = "", label }: { propertyId: string; className?: string; label?: string }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const favKey = ["favorite-ids", user?.id ?? "guest"];

  const { data: ids = [] } = useQuery({
    queryKey: favKey,
    queryFn: async () => {
      if (!user) return getGuestFavoriteIds();
      const { data, error } = await supabase.from("favorites").select("property_id").eq("user_id", user.id);
      if (error) throw error;
      return (data ?? []).map((r) => r.property_id);
    },
  });

  const active = ids.includes(propertyId);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!user) return toggleGuestFavorite(propertyId, !active);
      await toggleFavorite(user.id, propertyId, !active);
      return null;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: favKey });
      qc.invalidateQueries({ queryKey: ["favorites", user?.id ?? null] });
      qc.invalidateQueries({ queryKey: ["guest-favorites"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <button
      type="button"
      aria-label="Save"
      aria-pressed={active}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        mutation.mutate();
      }}
      className={
        label
          ? `flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition-colors hover:bg-muted ${className}`
          : `grid size-9 place-items-center rounded-full bg-card/85 backdrop-blur transition-transform hover:scale-105 ${className}`
      }
    >
      <Heart className={`size-4.5 ${active ? "fill-brand text-brand" : "text-foreground"}`} />
      {label ? <span>{label}</span> : null}
    </button>
  );
}
