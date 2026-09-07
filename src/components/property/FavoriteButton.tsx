import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toggleFavorite } from "@/lib/data";

export function FavoriteButton({ propertyId, className = "", label }: { propertyId: string; className?: string; label?: string }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: ids = [] } = useQuery({
    queryKey: ["favorite-ids", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("favorites").select("property_id").eq("user_id", user!.id);
      if (error) throw error;
      return (data ?? []).map((r) => r.property_id);
    },
  });

  const active = ids.includes(propertyId);

  const mutation = useMutation({
    mutationFn: () => toggleFavorite(user!.id, propertyId, !active),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["favorite-ids", user?.id] });
      qc.invalidateQueries({ queryKey: ["favorites", user?.id] });
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
        if (!user) {
          navigate({ to: "/auth" });
          return;
        }
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