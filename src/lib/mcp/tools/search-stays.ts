import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseAnon, textResult, errorResult } from "../supabase";

export default defineTool({
  name: "search_stays",
  title: "Search stays",
  description:
    "Search approved Armenian stays (hotels, guesthouses, cabins, villas, apartments) by destination, dates, guests, price and type.",
  inputSchema: {
    destination: z.string().trim().optional().describe("City, region or property name, e.g. Dilijan"),
    check_in: z.string().optional().describe("Check-in date YYYY-MM-DD"),
    check_out: z.string().optional().describe("Check-out date YYYY-MM-DD"),
    guests: z.number().int().min(1).max(50).optional(),
    property_types: z.array(z.string()).optional().describe("Property type codes, e.g. guesthouse, hotel, cabin"),
    min_price: z.number().optional().describe("Minimum price per night in AMD"),
    max_price: z.number().optional().describe("Maximum price per night in AMD"),
    sort: z.enum(["recommended", "price_asc", "price_desc", "rating", "popular"]).optional(),
    limit: z.number().int().min(1).max(30).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (input) => {
    const params: Record<string, unknown> = {
      p_guests: input.guests ?? 1,
      p_sort: input.sort ?? "recommended",
      p_limit: input.limit ?? 10,
      p_offset: 0,
    };
    if (input.destination) params['p_destination'] = input.destination;
    if (input.check_in) params['p_check_in'] = input.check_in;
    if (input.check_out) params['p_check_out'] = input.check_out;
    if (input.property_types?.length) params['p_types'] = input.property_types;
    if (input.min_price != null) params['p_min_price'] = input.min_price;
    if (input.max_price != null) params['p_max_price'] = input.max_price;

    const { data, error } = await supabaseAnon().rpc("search_properties", params);
    if (error) return errorResult(error.message);
    const rows = (data ?? []) as Array<Record<string, unknown>>;
    return textResult(
      rows.map((r) => ({
        name: r['name'],
        slug: r['slug'],
        type: r['property_type'],
        city: r['city_code'],
        price_per_night: r['price_per_night'],
        currency: r['currency'],
        max_guests: r['max_guests'],
        bedrooms: r['bedrooms'],
        rating: r['rating'],
        reviews: r['review_count'],
      })),
    );
  },
});