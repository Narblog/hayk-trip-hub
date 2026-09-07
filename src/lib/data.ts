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
export const maxGuestsQuery = () =>
  queryOptions({
    queryKey: ["max-guests"],
    staleTime: 1000 * 60 * 30,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("max_guests")
        .eq("status", "APPROVED")
        .eq("is_active", true)
        .order("max_guests", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return Math.max(1, Number(data?.max_guests ?? 0) || 1);
    },
  });

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

export type SimilarProperty = {
  id: string;
  name: string;
  slug: string;
  city_code: string | null;
  price_per_night: number;
  currency: string;
  rating: number;
  review_count: number;
  main_image_url: string | null;
};

export const similarPropertiesQuery = (
  cityCode: string | null,
  regionCode: string | null,
  excludeId: string | null,
) =>
  queryOptions({
    queryKey: ["similar-properties", cityCode, regionCode, excludeId],
    enabled: !!excludeId && !!(cityCode || regionCode),
    queryFn: async () => {
      let q = supabase
        .from("properties")
        .select("id,name,slug,city_code,price_per_night,currency,rating,review_count,main_image_url")
        .eq("status", "APPROVED")
        .eq("is_active", true)
        .order("rating", { ascending: false })
        .limit(4);
      if (cityCode) q = q.eq("city_code", cityCode);
      else if (regionCode) q = q.eq("region_code", regionCode);
      if (excludeId) q = q.neq("id", excludeId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as SimilarProperty[];
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
async function collection(
  filter: { type?: string; types?: string[]; featured?: boolean; recent?: boolean },
  limit = 8,
) {
  let q = supabase
    .from("properties")
    .select("id,name,slug,property_type,city_code,region_code,price_per_night,currency,max_guests,bedrooms,rating,review_count,main_image_url,is_demo,is_featured")
    .eq("status", "APPROVED")
    .eq("is_active", true)
    .limit(limit);
  if (filter.types) q = q.in("property_type", filter.types);
  if (filter.featured) q = q.eq("is_featured", true);
  const { data, error } = filter.recent
    ? await q.order("created_at", { ascending: false })
    : await q.order("rating", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export const homeQuery = () =>
  queryOptions({
    queryKey: ["home"],
    queryFn: async () => {
      const [recommended, guesthouses, cabins, hotels, recent, all, tours, cities] = await Promise.all([
        collection({ featured: true }),
        collection({ types: ["guesthouse"] }),
        collection({ types: ["cabin", "glamping", "cottage"] }),
        collection({ types: ["hotel", "resort"] }),
        collection({ recent: true }, 12),
        collection({}, 32),
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
        recent,
        all,
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

export type StatusHistoryRow = {
  id: string;
  property_id: string;
  old_status: ListingStatus | null;
  new_status: ListingStatus;
  note: string | null;
  created_at: string;
};

export const ownerStatusHistoryQuery = (propertyIds: string[]) =>
  queryOptions({
    queryKey: ["status-history", [...propertyIds].sort()],
    enabled: propertyIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("property_status_history")
        .select("id,property_id,old_status,new_status,note,created_at")
        .in("property_id", propertyIds)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as StatusHistoryRow[];
    },
  });

export async function becomeOwner() {
  const rpc = (supabase.rpc as unknown as (
    fn: "become_owner",
  ) => Promise<{ error: { message: string } | null }>).bind(supabase);
  const { error } = await rpc("become_owner");
  if (error) throw error;
}

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
export async function adminDeleteProperty(adminId: string, propertyId: string) {
  const { error } = await supabase.from("properties").delete().eq("id", propertyId);
  if (error) throw error;
  await supabase.from("admin_actions").insert({
    admin_id: adminId,
    action: "property.deleted",
    target_type: "property",
    target_id: propertyId,
  });
}

export async function adminUpdateProperty(
  adminId: string,
  propertyId: string,
  patch: { name?: string; price_per_night?: number; max_guests?: number; is_featured?: boolean; is_active?: boolean },
) {
  const { error } = await supabase.from("properties").update(patch).eq("id", propertyId);
  if (error) throw error;
  await supabase.from("admin_actions").insert({
    admin_id: adminId,
    action: "property.updated",
    target_type: "property",
    target_id: propertyId,
  });
}

// ---------- admin: cities ----------
export type CityInput = {
  code: string;
  region_code: string;
  name_hy: string;
  name_en: string;
  name_ru: string;
  is_popular?: boolean;
  sort_order?: number;
  image_url?: string | null;
};


export const adminCitiesQuery = () =>
  queryOptions({
    queryKey: ["admin-cities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cities")
        .select("*")
        .order("sort_order")
        .order("name_hy");
      if (error) throw error;
      return data ?? [];
    },
  });

export async function adminUpsertCity(adminId: string, city: CityInput) {
  const payload = {
    ...city,
    code: city.code.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-"),
    is_popular: !!city.is_popular,
    sort_order: Number(city.sort_order ?? 100),
  };
  const { error } = await supabase.from("cities").upsert(payload, { onConflict: "code" });
  if (error) throw error;
  await supabase.from("admin_actions").insert({
    admin_id: adminId,
    action: "city.upserted",
    target_type: "city",
    target_id: null,
    notes: payload.code,
  });
  return payload;
}

export async function adminDeleteCity(adminId: string, code: string) {
  const { error } = await supabase.from("cities").delete().eq("code", code);
  if (error) throw error;
  await supabase.from("admin_actions").insert({
    admin_id: adminId,
    action: "city.deleted",
    target_type: "city",
    target_id: null,
    notes: code,
  });
}

// ---------- tours ----------
export type TourListItem = {
  id: string;
  name: string;
  slug: string;
  category: string;
  city_code: string | null;
  region_code: string | null;
  location: string | null;
  description: string | null;
  meeting_point: string | null;
  duration_hours: number;
  currency: string;
  price: number;
  max_participants: number;
  contact_phone: string | null;
  contact_whatsapp: string | null;
  contact_instagram: string | null;
  main_image_url: string | null;
  rating: number;
  review_count: number;
  view_count: number;
};

export const toursListQuery = () =>
  queryOptions({
    queryKey: ["tours-list"],
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tours")
        .select(
          "id,name,slug,category,city_code,region_code,location,description,meeting_point,duration_hours,currency,price,max_participants,contact_phone,contact_whatsapp,contact_instagram,main_image_url,rating,review_count,view_count",
        )
        .eq("status", "APPROVED")
        .order("rating", { ascending: false, nullsFirst: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as TourListItem[];
    },
  });

// Related tours for a property: same region (or city), featured first.
export const relatedToursQuery = (regionCode: string | null | undefined, cityCode: string | null | undefined) =>
  queryOptions({
    queryKey: ["related-tours", regionCode ?? null, cityCode ?? null],
    enabled: !!(regionCode || cityCode),
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const filters: string[] = [];
      if (regionCode) filters.push(`region_code.eq.${regionCode}`);
      if (cityCode) filters.push(`city_code.eq.${cityCode}`);
      const { data, error } = await supabase
        .from("tours")
        .select(
          "id,name,slug,category,city_code,region_code,location,duration_hours,currency,price,main_image_url,rating,review_count,is_featured",
        )
        .eq("status", "APPROVED")
        .or(filters.join(","))
        .order("is_featured", { ascending: false })
        .order("rating", { ascending: false, nullsFirst: false })
        .limit(3);
      if (error) throw error;
      return (data ?? []) as RelatedTour[];
    },
  });

export type RelatedTour = {
  id: string;
  name: string;
  slug: string;
  category: string | null;
  city_code: string | null;
  region_code: string | null;
  location: string | null;
  duration_hours: number | null;
  currency: string;
  price: number;
  main_image_url: string | null;
  rating: number;
  review_count: number;
  is_featured: boolean;
};


// ---------- destinations ----------
export type DestinationItem = {
  code: string;
  name_en: string;
  name_hy: string;
  name_ru: string;
  region_code: string;
  image_url: string | null;
  is_popular: boolean;
  stays: number;
};

export const destinationsQuery = () =>
  queryOptions({
    queryKey: ["destinations"],
    staleTime: 1000 * 60 * 5,
    queryFn: async (): Promise<DestinationItem[]> => {
      const [cities, props] = await Promise.all([
        supabase.from("cities").select("code,name_en,name_hy,name_ru,region_code,image_url,is_popular,sort_order").order("sort_order"),
        supabase.from("properties").select("city_code").eq("status", "APPROVED").eq("is_active", true),
      ]);
      if (cities.error) throw cities.error;
      if (props.error) throw props.error;
      const counts = new Map<string, number>();
      for (const p of props.data ?? []) {
        if (!p.city_code) continue;
        counts.set(p.city_code, (counts.get(p.city_code) ?? 0) + 1);
      }
      return (cities.data ?? []).map((c) => ({
        code: c.code,
        name_en: c.name_en,
        name_hy: c.name_hy,
        name_ru: c.name_ru,
        region_code: c.region_code,
        image_url: c.image_url,
        is_popular: c.is_popular,
        stays: counts.get(c.code) ?? 0,
      }));
    },
  });

// ---------- tours: owner + admin ----------
export const ownerToursQuery = (userId: string | null) =>
  queryOptions({
    queryKey: ["owner-tours", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tours")
        .select("*")
        .eq("owner_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

export const adminToursQuery = (status: string) =>
  queryOptions({
    queryKey: ["admin-tours", status],
    queryFn: async () => {
      let q = supabase.from("tours").select("*").order("created_at", { ascending: false }).limit(200);
      if (status !== "ALL") q = q.eq("status", status as ListingStatus);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

export async function adminSetTourFeatured(adminId: string, tourId: string, isFeatured: boolean) {
  const { error } = await supabase.from("tours").update({ is_featured: isFeatured }).eq("id", tourId);
  if (error) throw error;
  await supabase.from("admin_actions").insert({
    admin_id: adminId,
    action: isFeatured ? "tour.featured" : "tour.unfeatured",
    target_type: "tour",
    target_id: tourId,
  });
}

export async function adminSetTourStatus(adminId: string, tourId: string, status: ListingStatus, note?: string) {
  const { error } = await supabase
    .from("tours")
    .update({ status, admin_note: note ?? null })
    .eq("id", tourId);
  if (error) throw error;
  await supabase.from("admin_actions").insert({
    admin_id: adminId,
    action: `tour.${status.toLowerCase()}`,
    target_type: "tour",
    target_id: tourId,
    notes: note ?? null,
  });
}

export async function adminDeleteTour(adminId: string, tourId: string) {
  const { error } = await supabase.from("tours").delete().eq("id", tourId);
  if (error) throw error;
  await supabase.from("admin_actions").insert({
    admin_id: adminId,
    action: "tour.deleted",
    target_type: "tour",
    target_id: tourId,
  });
}

// ---------- reviews ----------
export type PropertyReview = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  user_id: string;
  display_name: string;
};

export const propertyReviewsQuery = (propertyId: string | undefined) =>
  queryOptions({
    queryKey: ["property-reviews", propertyId],
    enabled: !!propertyId,
    queryFn: async () => {
      const rpc = (supabase.rpc as unknown as (
        fn: "property_reviews",
        params: Record<string, unknown>,
      ) => Promise<{ data: unknown; error: { message: string } | null }>).bind(supabase);
      const { data, error } = await rpc("property_reviews", { p_property_id: propertyId });
      if (error) throw error;
      return (data ?? []) as PropertyReview[];
    },
  });

export const myReviewQuery = (propertyId: string | undefined, userId: string | null) =>
  queryOptions({
    queryKey: ["my-review", propertyId, userId],
    enabled: !!propertyId && !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("id,rating,comment,status")
        .eq("property_id", propertyId!)
        .eq("user_id", userId!)
        .maybeSingle();
      if (error) throw error;
      return data ?? null;
    },
  });

export async function saveReview(input: {
  id?: string | undefined;
  propertyId: string;
  userId: string;
  rating: number;
  comment: string;
}) {
  const payload = { rating: input.rating, comment: input.comment.trim() || null };
  if (input.id) {
    const { error } = await supabase.from("reviews").update(payload).eq("id", input.id);
    if (error) throw error;
    return;
  }
  const { error } = await supabase.from("reviews").insert({
    property_id: input.propertyId,
    user_id: input.userId,
    status: "APPROVED",
    ...payload,
  });
  if (error) throw error;
}

export async function deleteReview(id: string) {
  const { error } = await supabase.from("reviews").delete().eq("id", id);
  if (error) throw error;
}

// ---------- analytics ----------
export type AnalyticsOverviewRow = {
  property_id: string;
  property_name: string;
  slug: string;
  status: ListingStatus;
  is_active: boolean;
  owner_id: string | null;
  unique_visitors: number;
  total_views: number;
  contact_clicks: number;
  phone_clicks: number;
  whatsapp_clicks: number;
  instagram_clicks: number;
  unique_contacted: number;
  avg_rating: number;
  review_count: number;
};

export type AnalyticsDailyRow = { day: string; views: number; contacts: number };

function sinceIso(days: number | null): string | null {
  if (!days) return null;
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

export const analyticsOverviewQuery = (opts: {
  days: number | null;
  propertyId?: string | null;
  ownerId?: string | null;
  enabled?: boolean;
}) =>
  queryOptions({
    queryKey: ["analytics-overview", opts.days, opts.propertyId ?? null, opts.ownerId ?? null],
    enabled: opts.enabled !== false,
    queryFn: async () => {
      const rpc = (supabase.rpc as unknown as (
        fn: "property_analytics_overview",
        params: Record<string, unknown>,
      ) => Promise<{ data: unknown; error: { message: string } | null }>).bind(supabase);
      const { data, error } = await rpc("property_analytics_overview", {
        p_from: sinceIso(opts.days),
        p_property_id: opts.propertyId ?? null,
        p_owner_id: opts.ownerId ?? null,
      });
      if (error) throw error;
      return (data ?? []) as AnalyticsOverviewRow[];
    },
  });

export const analyticsDailyQuery = (opts: {
  days: number | null;
  propertyId?: string | null;
  ownerId?: string | null;
  enabled?: boolean;
}) =>
  queryOptions({
    queryKey: ["analytics-daily", opts.days, opts.propertyId ?? null, opts.ownerId ?? null],
    enabled: opts.enabled !== false,
    queryFn: async () => {
      const rpc = (supabase.rpc as unknown as (
        fn: "property_analytics_daily",
        params: Record<string, unknown>,
      ) => Promise<{ data: unknown; error: { message: string } | null }>).bind(supabase);
      const { data, error } = await rpc("property_analytics_daily", {
        p_from: sinceIso(opts.days),
        p_property_id: opts.propertyId ?? null,
        p_owner_id: opts.ownerId ?? null,
      });
      if (error) throw error;
      return (data ?? []) as AnalyticsDailyRow[];
    },
  });

// ---------- CMS pages ----------
export type PageRow = {
  id: string;
  slug: string;
  title_en: string;
  title_hy: string;
  title_ru: string;
  content_en: string;
  content_hy: string;
  content_ru: string;
  seo_description_en: string | null;
  seo_description_hy: string | null;
  seo_description_ru: string | null;
  show_in_footer: boolean;
  sort_order: number;
  is_published: boolean;
};

export type PageInput = Omit<PageRow, "id"> & { id?: string | undefined };

export const footerPagesQuery = () =>
  queryOptions({
    queryKey: ["footer-pages"],
    queryFn: async (): Promise<PageRow[]> => {
      const { data, error } = await supabase
        .from("pages")
        .select("*")
        .eq("is_published", true)
        .eq("show_in_footer", true)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as PageRow[];
    },
  });

export const pageQuery = (slug: string) =>
  queryOptions({
    queryKey: ["page", slug],
    queryFn: async (): Promise<PageRow | null> => {
      const { data, error } = await supabase.from("pages").select("*").eq("slug", slug).maybeSingle();
      if (error) throw error;
      return (data ?? null) as PageRow | null;
    },
  });

export const adminPagesQuery = () =>
  queryOptions({
    queryKey: ["admin-pages"],
    queryFn: async (): Promise<PageRow[]> => {
      const { data, error } = await supabase.from("pages").select("*").order("sort_order").order("slug");
      if (error) throw error;
      return (data ?? []) as PageRow[];
    },
  });

export async function adminSavePage(adminId: string, page: PageInput) {
  const { id, ...rest } = page;
  const payload = {
    ...rest,
    slug: page.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-"),
    sort_order: Number(page.sort_order ?? 100),
  };
  // Block slug reuse across pages: renaming an existing page to another page's
  // slug, or creating a new page with an existing slug, must not overwrite.
  const { data: clash } = await supabase
    .from("pages")
    .select("id")
    .eq("slug", payload.slug)
    .maybeSingle();
  if (clash && clash.id !== id) throw new Error(`Slug "${payload.slug}" is already used by another page`);
  if (id) {
    const { error } = await supabase.from("pages").update(payload).eq("id", id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("pages").insert(payload);
    if (error) throw error;
  }
  await supabase.from("admin_actions").insert({
    admin_id: adminId,
    action: page.id ? "page.updated" : "page.created",
    target_type: "page",
    target_id: page.id ?? null,
    notes: payload.slug,
  });
  return payload;
}

export async function adminDeletePage(adminId: string, id: string, slug: string) {
  const { error } = await supabase.from("pages").delete().eq("id", id);
  if (error) throw error;
  await supabase.from("admin_actions").insert({
    admin_id: adminId,
    action: "page.deleted",
    target_type: "page",
    target_id: id,
    notes: slug,
  });
}

// ---------- pricing ----------
export type PricingType = "FIXED" | "TIERED" | "BASE_PLUS_GUEST";

export type PricingTier = {
  id?: string;
  min_guests: number;
  max_guests: number;
  price_per_night: number;
  sort_order: number;
};

export type PropertyPricing = {
  pricing_type: PricingType;
  fixed_price: number | null;
  base_price: number | null;
  included_guests: number;
  extra_guest_price: number | null;
  currency: string;
  tiers: PricingTier[];
};

export const pricingQuery = (propertyId: string | undefined) =>
  queryOptions({
    queryKey: ["pricing", propertyId],
    enabled: !!propertyId,
    queryFn: async (): Promise<PropertyPricing | null> => {
      const [{ data: base, error: e1 }, { data: tiers, error: e2 }] = await Promise.all([
        supabase
          .from("property_pricing")
          .select("pricing_type, fixed_price, base_price, included_guests, extra_guest_price, currency")
          .eq("property_id", propertyId!)
          .maybeSingle(),
        supabase
          .from("property_pricing_tiers")
          .select("id, min_guests, max_guests, price_per_night, sort_order")
          .eq("property_id", propertyId!)
          .order("sort_order"),
      ]);
      if (e1) throw e1;
      if (e2) throw e2;
      if (!base) return null;
      return {
        pricing_type: base.pricing_type as PricingType,
        fixed_price: base.fixed_price,
        base_price: base.base_price,
        included_guests: base.included_guests,
        extra_guest_price: base.extra_guest_price,
        currency: base.currency,
        tiers: (tiers ?? []) as PricingTier[],
      };
    },
  });

export async function savePricing(propertyId: string, input: PropertyPricing) {
  const { error } = await supabase.from("property_pricing").upsert(
    {
      property_id: propertyId,
      pricing_type: input.pricing_type,
      fixed_price: input.pricing_type === "FIXED" ? input.fixed_price : null,
      base_price: input.pricing_type === "BASE_PLUS_GUEST" ? input.base_price : null,
      included_guests: input.included_guests,
      extra_guest_price: input.pricing_type === "BASE_PLUS_GUEST" ? input.extra_guest_price : null,
      currency: input.currency,
    },
    { onConflict: "property_id" },
  );
  if (error) throw error;

  const { error: delErr } = await supabase.from("property_pricing_tiers").delete().eq("property_id", propertyId);
  if (delErr) throw delErr;

  if (input.pricing_type === "TIERED" && input.tiers.length) {
    const { error: insErr } = await supabase.from("property_pricing_tiers").insert(
      input.tiers.map((tier, i) => ({
        property_id: propertyId,
        min_guests: tier.min_guests,
        max_guests: tier.max_guests,
        price_per_night: tier.price_per_night,
        sort_order: i,
      })),
    );
    if (insErr) throw insErr;
  }

  if (input.pricing_type === "FIXED" && input.fixed_price) {
    await supabase.from("properties").update({ price_per_night: input.fixed_price }).eq("id", propertyId);
  }
}

export const quoteQuery = (propertyId: string | undefined, guests: number) =>
  queryOptions({
    queryKey: ["quote", propertyId, guests],
    enabled: !!propertyId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("quote_property_price", {
        p_property_id: propertyId!,
        p_guests: guests,
      });
      if (error) throw error;
      return (data ?? [])[0] ?? null;
    },
  });

// ---------- booking requests ----------
export type BookingStatus = "PENDING" | "ACCEPTED" | "DECLINED" | "CANCELLED" | "COMPLETED";

export type BookingRow = {
  id: string;
  reference: string;
  property_id: string;
  guest_name: string;
  guest_phone: string;
  guest_email: string | null;
  message: string | null;
  check_in: string;
  check_out: string;
  nights: number;
  adults: number;
  children: number;
  infants: number;
  nightly_price: number;
  total_price: number;
  confirmed_total_price: number | null;
  price_change_note: string | null;
  currency: string;
  status: BookingStatus;
  decline_reason: string | null;
  created_at: string;
  properties?: { name: string; slug: string } | null;
};

const BOOKING_COLUMNS =
  "id, reference, property_id, guest_name, guest_phone, guest_email, message, check_in, check_out, nights, adults, children, infants, nightly_price, total_price, confirmed_total_price, price_change_note, currency, status, decline_reason, created_at, properties(name, slug)";

export const ownerBookingsQuery = (userId: string | null) =>
  queryOptions({
    queryKey: ["owner-bookings", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("booking_requests")
        .select(BOOKING_COLUMNS)
        .eq("owner_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as BookingRow[];
    },
  });

export const myBookingsQuery = (userId: string | null) =>
  queryOptions({
    queryKey: ["my-bookings", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("booking_requests")
        .select(BOOKING_COLUMNS)
        .eq("customer_user_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as BookingRow[];
    },
  });

export const propertyBookingsQuery = (propertyId: string | undefined) =>
  queryOptions({
    queryKey: ["property-bookings", propertyId],
    enabled: !!propertyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("booking_requests")
        .select("id, check_in, check_out, status")
        .eq("property_id", propertyId!)
        .in("status", ["PENDING", "ACCEPTED"]);
      if (error) throw error;
      return data ?? [];
    },
  });

export type BookingInput = {
  propertyId: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  infants: number;
  name: string;
  phone: string;
  email: string;
  message: string;
};

export async function createBookingRequest(input: BookingInput) {
  const { data, error } = await supabase.rpc("create_booking_request", {
    p_property_id: input.propertyId,
    p_check_in: input.checkIn,
    p_check_out: input.checkOut,
    p_adults: input.adults,
    p_children: input.children,
    p_infants: input.infants,
    p_name: input.name,
    p_phone: input.phone,
    p_email: input.email,
    p_message: input.message,
  });
  if (error) throw error;
  const row = (data ?? [])[0];
  if (!row) throw new Error("BOOKING_FAILED");
  if (typeof window !== "undefined" && row.guest_token) {
    const store = JSON.parse(window.localStorage.getItem("stayland.bookings") ?? "[]") as {
      id: string;
      reference: string;
      token: string;
    }[];
    store.unshift({ id: row.booking_id, reference: row.reference, token: row.guest_token });
    window.localStorage.setItem("stayland.bookings", JSON.stringify(store.slice(0, 20)));
  }
  return row;
}

export function localGuestBookings() {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem("stayland.bookings") ?? "[]") as {
      id: string;
      reference: string;
      token: string;
    }[];
  } catch {
    return [];
  }
}

export async function respondBooking(input: {
  bookingId: string;
  action: "ACCEPT" | "DECLINE";
  confirmedTotal?: number | null;
  note?: string;
  reason?: string;
}) {
  const { error } = await supabase.rpc("respond_booking_request", {
    p_booking_id: input.bookingId,
    p_action: input.action,
    ...(input.confirmedTotal != null ? { p_confirmed_total: input.confirmedTotal } : {}),
    ...(input.note ? { p_note: input.note } : {}),
    ...(input.reason ? { p_reason: input.reason } : {}),
  });
  if (error) throw error;
}

export async function cancelBooking(bookingId: string, token?: string) {
  const { error } = await supabase.rpc("cancel_booking_request", {
    p_booking_id: bookingId,
    ...(token ? { p_token: token } : {}),
  });
  if (error) throw error;
}

export async function bookingByToken(bookingId: string, token: string) {
  const { data, error } = await supabase.rpc("booking_by_token", { p_booking_id: bookingId, p_token: token });
  if (error) throw error;
  return (data ?? [])[0] ?? null;
}
