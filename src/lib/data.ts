import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ListingStatus =
  | "DRAFT"
  | "PENDING_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "SUSPENDED"
  | "CHANGES_REQUESTED";

export type SearchResult = {
  id: string;
  name: string;
  slug: string;
  property_type: string;
  city_code: string | null;
  region_code: string | null;
  price_per_night: number;
  currency: string;
  max_guests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  rating: number;
  review_count: number;
  main_image_url: string | null;
  latitude: number | null;
  longitude: number | null;
  is_featured: boolean;
  amenity_codes: string[];
  total_count: number;
};

export type SearchParams = {
  destination?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  types?: string[];
  amenities?: string[];
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  minRating?: number;
  sort?: string;
  page?: number;
  pageSize?: number;
};

export async function searchProperties(p: SearchParams): Promise<{ items: SearchResult[]; total: number }> {
  const pageSize = p.pageSize ?? 12;
  const args: Record<string, unknown> = {
    p_guests: Math.max(1, p.guests ?? 1),
    p_sort: p.sort ?? "recommended",
    p_limit: pageSize,
    p_offset: ((p.page ?? 1) - 1) * pageSize,
  };
  if (p.destination?.trim()) args["p_destination"] = p.destination.trim();
  if (p.checkIn) args["p_check_in"] = p.checkIn;
  if (p.checkOut) args["p_check_out"] = p.checkOut;
  if (p.types?.length) args["p_types"] = p.types;
  if (p.amenities?.length) args["p_amenities"] = p.amenities;
  if (p.minPrice != null) args["p_min_price"] = p.minPrice;
  if (p.maxPrice != null) args["p_max_price"] = p.maxPrice;
  if (p.bedrooms != null) args["p_bedrooms"] = p.bedrooms;
  if (p.minRating != null) args["p_min_rating"] = p.minRating;
  const rpc = (supabase.rpc as unknown as (
    fn: "search_properties",
    params: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: { message: string } | null }>).bind(supabase);
  const { data, error } = await rpc("search_properties", args);
  if (error) throw error;
  const items = (data ?? []) as unknown as SearchResult[];
  return { items, total: items[0]?.total_count ? Number(items[0].total_count) : 0 };
}

export const searchQuery = (p: SearchParams) =>
  queryOptions({ queryKey: ["search", p], queryFn: () => searchProperties(p) });

// ---------- reference data ----------
export const refDataQuery = () =>
  queryOptions({
    queryKey: ["ref-data"],
    staleTime: 1000 * 60 * 30,
    queryFn: async () => {
      const [cities, regions, types, amenities, categories] = await Promise.all([
        supabase.from("cities").select("*").order("sort_order"),
        supabase.from("regions").select("*").order("sort_order"),
        supabase.from("property_types").select("*").order("sort_order"),
        supabase.from("amenities").select("*").order("sort_order"),
        supabase.from("tour_categories").select("*").order("sort_order"),
      ]);
      const err = cities.error || regions.error || types.error || amenities.error || categories.error;
      if (err) throw err;
      return {
        cities: cities.data ?? [],
        regions: regions.data ?? [],
        types: types.data ?? [],
        amenities: amenities.data ?? [],
        categories: categories.data ?? [],
      };
    },
  });

// ---------- property detail ----------
export const propertyQuery = (slug: string) =>
  queryOptions({
    queryKey: ["property", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("*, property_images(*), property_amenities(amenity_code), reviews(id, rating, comment, created_at, status, user_id)")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export const availabilityQuery = (propertyId: string | undefined) =>
  queryOptions({
    queryKey: ["availability", propertyId],
    enabled: !!propertyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("availability")
        .select("date, status")
        .eq("property_id", propertyId!);
      if (error) throw error;
      return data ?? [];
    },
  });

// ---------- home page collections ----------
async function collection(filter: { type?: string; types?: string[]; featured?: boolean }, limit = 8) {
  let q = supabase
    .from("properties")
    .select("id,name,slug,property_type,city_code,region_code,price_per_night,currency,max_guests,bedrooms,rating,review_count,main_image_url,is_demo")
    .eq("status", "APPROVED")
    .eq("is_active", true)
    .limit(limit);
  if (filter.types) q = q.in("property_type", filter.types);
  if (filter.featured) q = q.eq("is_featured", true);
  const { data, error } = await q.order("rating", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export const homeQuery = () =>
  queryOptions({
    queryKey: ["home"],
    queryFn: async () => {
      const [recommended, guesthouses, cabins, hotels, tours, cities] = await Promise.all([
        collection({ featured: true }),
        collection({ types: ["guesthouse"] }),
        collection({ types: ["cabin", "glamping", "cottage"] }),
        collection({ types: ["hotel", "resort"] }),
        supabase
          .from("tours")
          .select("id,name,slug,category,city_code,price,currency,duration_hours,main_image_url,rating,review_count")
          .eq("status", "APPROVED")
          .limit(6),
        supabase.from("cities").select("*").eq("is_popular", true).order("sort_order"),
      ]);
      if (tours.error) throw tours.error;
      if (cities.error) throw cities.error;
      return {
        recommended,
        guesthouses,
        cabins,
        hotels,
        tours: tours.data ?? [],
        cities: cities.data ?? [],
      };
    },
  });

// ---------- favorites ----------
export const favoritesQuery = (userId: string | null) =>
  queryOptions({
    queryKey: ["favorites", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("favorites")
        .select("property_id, properties(id,name,slug,property_type,city_code,price_per_night,currency,max_guests,bedrooms,rating,review_count,main_image_url)")
        .eq("user_id", userId!);
      if (error) throw error;
      return data ?? [];
    },
  });

export async function toggleFavorite(userId: string, propertyId: string, on: boolean) {
  if (on) {
    const { error } = await supabase.from("favorites").insert({ user_id: userId, property_id: propertyId });
    if (error && error.code !== "23505") throw error;
  } else {
    const { error } = await supabase.from("favorites").delete().eq("user_id", userId).eq("property_id", propertyId);
    if (error) throw error;
  }
}

// ---------- analytics ----------
export async function trackContact(
  propertyId: string | null,
  tourId: string | null,
  type: "PHONE" | "WHATSAPP" | "INSTAGRAM" | "EMAIL" | "TELEGRAM",
  userId: string | null,
) {
  await supabase.from("contact_events").insert({
    property_id: propertyId,
    tour_id: tourId,
    contact_type: type,
    user_id: userId,
  });
}

export async function trackView(propertyId: string) {
  await supabase.rpc("increment_property_view", { p_property_id: propertyId });
}

export async function trackSearch(p: SearchParams, results: number, userId: string | null) {
  await supabase.from("search_events").insert({
    destination: p.destination ?? null,
    check_in: p.checkIn || null,
    check_out: p.checkOut || null,
    guests: p.guests ?? null,
    results_count: results,
    user_id: userId,
  });
}

// ---------- owner ----------
export const ownerPropertiesQuery = (userId: string | null) =>
  queryOptions({
    queryKey: ["owner-properties", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("owner_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

export const ownerStatsQuery = (userId: string | null) =>
  queryOptions({
    queryKey: ["owner-stats", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data: props, error } = await supabase
        .from("properties")
        .select("id,status,view_count")
        .eq("owner_id", userId!);
      if (error) throw error;
      const ids = (props ?? []).map((p) => p.id);
      let contacts: { contact_type: string; property_id: string | null }[] = [];
      if (ids.length) {
        const { data } = await supabase.from("contact_events").select("contact_type,property_id").in("property_id", ids);
        contacts = data ?? [];
      }
      return {
        total: props?.length ?? 0,
        approved: props?.filter((p) => p.status === "APPROVED").length ?? 0,
        pending: props?.filter((p) => p.status === "PENDING_REVIEW").length ?? 0,
        views: props?.reduce((s, p) => s + (p.view_count ?? 0), 0) ?? 0,
        contacts: contacts.length,
        phone: contacts.filter((c) => c.contact_type === "PHONE").length,
        whatsapp: contacts.filter((c) => c.contact_type === "WHATSAPP").length,
        instagram: contacts.filter((c) => c.contact_type === "INSTAGRAM").length,
      };
    },
  });

export const notificationsQuery = (userId: string | null) =>
  queryOptions({
    queryKey: ["notifications", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return data ?? [];
    },
  });

export const profileQuery = (userId: string | null) =>
  queryOptions({
    queryKey: ["profile", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId!).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

// ---------- admin ----------
export const adminStatsQuery = () =>
  queryOptions({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const count = async (table: "properties" | "tours" | "reviews" | "profiles", col?: string, val?: string) => {
        let q = supabase.from(table).select("id", { count: "exact", head: true });
        if (col && val) q = q.eq(col, val);
        const { count: c } = await q;
        return c ?? 0;
      };
      const { count: owners } = await supabase
        .from("user_roles")
        .select("id", { count: "exact", head: true })
        .eq("role", "owner");
      return {
        users: await count("profiles"),
        owners: owners ?? 0,
        properties: await count("properties"),
        pending: await count("properties", "status", "PENDING_REVIEW"),
        approved: await count("properties", "status", "APPROVED"),
        rejected: await count("properties", "status", "REJECTED"),
        suspended: await count("properties", "status", "SUSPENDED"),
        tours: await count("tours"),
        reviews: await count("reviews"),
      };
    },
  });

export const adminPropertiesQuery = (status: string) =>
  queryOptions({
    queryKey: ["admin-properties", status],
    queryFn: async () => {
      let q = supabase.from("properties").select("*").order("created_at", { ascending: false }).limit(200);
      if (status !== "ALL") q = q.eq("status", status as ListingStatus);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

export const adminUsersQuery = () =>
  queryOptions({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const [profiles, roles] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(500),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      if (profiles.error) throw profiles.error;
      if (roles.error) throw roles.error;
      const byUser = new Map<string, string[]>();
      for (const r of roles.data ?? []) {
        byUser.set(r.user_id, [...(byUser.get(r.user_id) ?? []), r.role]);
      }
      return (profiles.data ?? []).map((p) => ({ ...p, roles: byUser.get(p.id) ?? [] }));
    },
  });

export const auditLogQuery = () =>
  queryOptions({
    queryKey: ["audit-log"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_actions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });

export async function adminSetStatus(
  adminId: string,
  propertyId: string,
  status: ListingStatus,
  note?: string,
) {
  const patch = {
    status,
    admin_note: note ?? null,
    ...(status === "APPROVED" ? { approved_at: new Date().toISOString() } : {}),
  };
  const { error } = await supabase.from("properties").update(patch).eq("id", propertyId);
  if (error) throw error;
  await supabase.from("admin_actions").insert({
    admin_id: adminId,
    action: `property.${status.toLowerCase()}`,
    target_type: "property",
    target_id: propertyId,
    notes: note ?? null,
  });
}