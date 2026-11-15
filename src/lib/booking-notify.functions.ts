import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Emails the guest of a standalone (no guesthouse) package booking once an admin accepts or declines it.
export const notifyPackageBookingDecision = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { bookingId: string }) => {
    if (!d || typeof d.bookingId !== "string" || !/^[0-9a-f-]{36}$/i.test(d.bookingId)) throw new Error("Invalid id");
    return d;
  })
  .handler(async ({ data, context }) => {
    // Read through the caller's own RLS: only admins can see these rows.
    const { data: b, error } = await context.supabase
      .from("booking_requests")
      .select("id, reference, status, guest_name, guest_email, check_in, check_out, total_price, confirmed_total_price, currency, decline_reason, property_id, packages(title)")
      .eq("id", data.bookingId)
      .maybeSingle();
    if (error || !b) return { sent: false, reason: "not_found" };
    if (b.property_id || !b.guest_email) return { sent: false, reason: "skipped" };
    if (b.status !== "ACCEPTED" && b.status !== "DECLINED") return { sent: false, reason: "not_decided" };
    const accepted = b.status === "ACCEPTED";
    const amount = Number(b.confirmed_total_price ?? b.total_price);
    const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");
    try {
      const r = await sendTemplateEmail("package-booking-decision", b.guest_email, {
        templateData: {
          name: b.guest_name,
          packageTitle: (b.packages as { title?: string } | null)?.title,
          reference: b.reference,
          accepted,
          checkIn: b.check_in,
          checkOut: b.check_out,
          total: `${amount.toLocaleString("en-US")} ${b.currency}`,
          reason: b.decline_reason ?? undefined,
        },
        idempotencyKey: `package-booking-decision-${b.id}-${b.status}`,
      });
      return r.sent ? { sent: true } : { sent: false, reason: r.reason };
    } catch (e) {
      console.error("package booking email failed", e);
      return { sent: false, reason: "error" };
    }
  });
