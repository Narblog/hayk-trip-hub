import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Star, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ErrorState, InlineLoader } from "@/components/common/states";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth";
import { deleteReview, myReviewQuery, propertyReviewsQuery, saveReview } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

function Stars({ value, size = "size-4" }: { value: number; size?: string }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`${size} ${n <= value ? "fill-gold text-gold" : "text-muted-foreground/40"}`} />
      ))}
    </span>
  );
}

export function ReviewsSection({ propertyId, ownerId }: { propertyId: string; ownerId: string | null }) {
  const { t } = useI18n();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: reviews = [], isPending, isError, error, refetch } = useQuery(propertyReviewsQuery(propertyId));
  const { data: mine } = useQuery(myReviewQuery(propertyId, user?.id ?? null));

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    setEditing(false);
    setRating(5);
    setComment("");
  }, [mine?.id, user?.id]);

  const isOwnProperty = !!user && !!ownerId && user.id === ownerId;
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  async function submit() {
    if (!user) return;
    setSaving(true);
    try {
      await saveReview({ id: mine?.id, propertyId, userId: user.id, rating, comment });
      await queryClient.invalidateQueries({ queryKey: ["property-reviews", propertyId] });
      await queryClient.invalidateQueries({ queryKey: ["my-review", propertyId] });
      await queryClient.invalidateQueries({ queryKey: ["property", propertyId] });
      toast.success(t("reviews.saved"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!mine) return;
    try {
      await deleteReview(mine.id);
      setRating(5);
      setComment("");
      await queryClient.invalidateQueries({ queryKey: ["property-reviews", propertyId] });
      await queryClient.invalidateQueries({ queryKey: ["my-review", propertyId] });
      toast.success(t("reviews.deleted"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <section className="mt-10">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="font-display text-xl font-semibold">{t("reviews.title")}</h2>
        {reviews.length ? (
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <Stars value={Math.round(avg)} />
            <span className="font-semibold text-foreground">{avg.toFixed(1)}</span>
            <span>{t("reviews.basedOn").replace("{n}", String(reviews.length))}</span>
          </span>
        ) : null}
      </div>

      {isPending ? (
        <InlineLoader />
      ) : isError ? (
        <div className="mt-4">
          <ErrorState message={error instanceof Error ? error.message : undefined} onRetry={() => refetch()} />
        </div>
      ) : reviews.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">{t("reviews.none")}</p>
      ) : (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {reviews.map((r) => (
            <li key={r.id} className="rounded-2xl border border-border/70 bg-card p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium">{r.display_name}</p>
                <span className="text-xs text-muted-foreground">{formatDate(r.created_at)}</span>
              </div>
              <div className="mt-1">
                <Stars value={r.rating} size="size-3.5" />
              </div>
              {r.comment ? <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{r.comment}</p> : null}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-6 rounded-2xl border border-border bg-surface p-4">
        {!user ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">{t("reviews.loginToReview")}</p>
            <Button asChild size="sm">
              <Link to="/auth">{t("nav.login")}</Link>
            </Button>
          </div>
        ) : isOwnProperty ? (
          <p className="text-sm text-muted-foreground">{t("reviews.ownerCannot")}</p>
        ) : (
          <div className="space-y-3">
            <p className="font-display text-lg">{mine ? t("reviews.edit") : t("reviews.write")}</p>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{t("reviews.yourRating")}</span>
              <span className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    aria-label={`${n}`}
                    onClick={() => setRating(n)}
                    className="p-1"
                  >
                    <Star className={`size-6 ${n <= rating ? "fill-gold text-gold" : "text-muted-foreground/40"}`} />
                  </button>
                ))}
              </span>
            </div>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t("reviews.commentPlaceholder")}
              rows={3}
            />
            <div className="flex flex-wrap gap-2">
              <Button onClick={submit} disabled={saving}>
                {t("reviews.submit")}
              </Button>
              {mine ? (
                <Button variant="outline" onClick={remove}>
                  <Trash2 className="size-4" /> {t("reviews.delete")}
                </Button>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
