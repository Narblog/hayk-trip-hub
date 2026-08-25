import { supabase } from "@/integrations/supabase/client";

const KEY = "stayland_visitor_token";

export type PropertyEventType = "property_view" | "phone_click" | "whatsapp_click" | "instagram_click";

export function visitorToken(): string {
  if (typeof window === "undefined") return "anon";
  try {
    let token = window.localStorage.getItem(KEY);
    if (!token) {
      token = crypto.randomUUID();
      window.localStorage.setItem(KEY, token);
    }
    return token;
  } catch {
    return "anon";
  }
}

/** Fire-and-forget analytics event. Never throws into the UI. */
export async function trackPropertyEvent(propertyId: string, eventType: PropertyEventType) {
  if (typeof window === "undefined" || !propertyId) return;
  try {
    const rpc = (supabase.rpc as unknown as (
      fn: "track_property_event",
      params: Record<string, unknown>,
    ) => Promise<{ error: unknown }>).bind(supabase);
    await rpc("track_property_event", {
      p_property_id: propertyId,
      p_event_type: eventType,
      p_visitor_token: visitorToken(),
    });
  } catch {
    /* analytics must never break the page */
  }
}
