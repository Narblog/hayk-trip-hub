export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_actions: {
        Row: {
          action: string
          admin_id: string | null
          created_at: string
          id: string
          notes: string | null
          target_id: string | null
          target_type: string
        }
        Insert: {
          action: string
          admin_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          target_id?: string | null
          target_type: string
        }
        Update: {
          action?: string
          admin_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          target_id?: string | null
          target_type?: string
        }
        Relationships: []
      }
      amenities: {
        Row: {
          category: string
          code: string
          icon: string | null
          name_en: string
          name_hy: string
          name_ru: string
          sort_order: number
        }
        Insert: {
          category?: string
          code: string
          icon?: string | null
          name_en: string
          name_hy: string
          name_ru: string
          sort_order?: number
        }
        Update: {
          category?: string
          code?: string
          icon?: string | null
          name_en?: string
          name_hy?: string
          name_ru?: string
          sort_order?: number
        }
        Relationships: []
      }
      availability: {
        Row: {
          created_at: string
          date: string
          id: string
          note: string | null
          property_id: string
          status: Database["public"]["Enums"]["availability_status"]
          unit_id: string | null
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          note?: string | null
          property_id: string
          status?: Database["public"]["Enums"]["availability_status"]
          unit_id?: string | null
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          note?: string | null
          property_id?: string
          status?: Database["public"]["Enums"]["availability_status"]
          unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "availability_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "availability_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "property_units"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_requests: {
        Row: {
          adults: number
          cancelled_at: string | null
          check_in: string
          check_out: string
          children: number
          confirmed_total_price: number | null
          created_at: string
          currency: string
          customer_user_id: string | null
          decline_reason: string | null
          guest_email: string | null
          guest_name: string
          guest_phone: string
          guest_token_hash: string | null
          id: string
          infants: number
          message: string | null
          nightly_price: number
          nights: number
          owner_id: string | null
          price_change_note: string | null
          property_id: string
          reference: string
          responded_at: string | null
          status: Database["public"]["Enums"]["booking_status"]
          total_price: number
          updated_at: string
        }
        Insert: {
          adults?: number
          cancelled_at?: string | null
          check_in: string
          check_out: string
          children?: number
          confirmed_total_price?: number | null
          created_at?: string
          currency?: string
          customer_user_id?: string | null
          decline_reason?: string | null
          guest_email?: string | null
          guest_name: string
          guest_phone: string
          guest_token_hash?: string | null
          id?: string
          infants?: number
          message?: string | null
          nightly_price: number
          nights: number
          owner_id?: string | null
          price_change_note?: string | null
          property_id: string
          reference: string
          responded_at?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          total_price: number
          updated_at?: string
        }
        Update: {
          adults?: number
          cancelled_at?: string | null
          check_in?: string
          check_out?: string
          children?: number
          confirmed_total_price?: number | null
          created_at?: string
          currency?: string
          customer_user_id?: string | null
          decline_reason?: string | null
          guest_email?: string | null
          guest_name?: string
          guest_phone?: string
          guest_token_hash?: string | null
          id?: string
          infants?: number
          message?: string | null
          nightly_price?: number
          nights?: number
          owner_id?: string | null
          price_change_note?: string | null
          property_id?: string
          reference?: string
          responded_at?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          total_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_requests_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      cities: {
        Row: {
          code: string
          image_url: string | null
          is_popular: boolean
          latitude: number | null
          longitude: number | null
          name_en: string
          name_hy: string
          name_ru: string
          region_code: string
          sort_order: number
        }
        Insert: {
          code: string
          image_url?: string | null
          is_popular?: boolean
          latitude?: number | null
          longitude?: number | null
          name_en: string
          name_hy: string
          name_ru: string
          region_code: string
          sort_order?: number
        }
        Update: {
          code?: string
          image_url?: string | null
          is_popular?: boolean
          latitude?: number | null
          longitude?: number | null
          name_en?: string
          name_hy?: string
          name_ru?: string
          region_code?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "cities_region_code_fkey"
            columns: ["region_code"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["code"]
          },
        ]
      }
      contact_events: {
        Row: {
          contact_type: Database["public"]["Enums"]["contact_type"]
          created_at: string
          id: string
          property_id: string | null
          tour_id: string | null
          user_id: string | null
        }
        Insert: {
          contact_type: Database["public"]["Enums"]["contact_type"]
          created_at?: string
          id?: string
          property_id?: string | null
          tour_id?: string | null
          user_id?: string | null
        }
        Update: {
          contact_type?: Database["public"]["Enums"]["contact_type"]
          created_at?: string
          id?: string
          property_id?: string | null
          tour_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_events_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_events_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "tours"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          property_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          property_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          property_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      pages: {
        Row: {
          content_en: string
          content_hy: string
          content_ru: string
          created_at: string
          id: string
          is_published: boolean
          seo_description_en: string | null
          seo_description_hy: string | null
          seo_description_ru: string | null
          show_in_footer: boolean
          slug: string
          sort_order: number
          title_en: string
          title_hy: string
          title_ru: string
          updated_at: string
        }
        Insert: {
          content_en?: string
          content_hy?: string
          content_ru?: string
          created_at?: string
          id?: string
          is_published?: boolean
          seo_description_en?: string | null
          seo_description_hy?: string | null
          seo_description_ru?: string | null
          show_in_footer?: boolean
          slug: string
          sort_order?: number
          title_en: string
          title_hy: string
          title_ru: string
          updated_at?: string
        }
        Update: {
          content_en?: string
          content_hy?: string
          content_ru?: string
          created_at?: string
          id?: string
          is_published?: boolean
          seo_description_en?: string | null
          seo_description_hy?: string | null
          seo_description_ru?: string | null
          show_in_footer?: boolean
          slug?: string
          sort_order?: number
          title_en?: string
          title_hy?: string
          title_ru?: string
          updated_at?: string
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          instagram: string | null
          phone: string | null
          preferred_language: string
          status: Database["public"]["Enums"]["account_status"]
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          instagram?: string | null
          phone?: string | null
          preferred_language?: string
          status?: Database["public"]["Enums"]["account_status"]
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          instagram?: string | null
          phone?: string | null
          preferred_language?: string
          status?: Database["public"]["Enums"]["account_status"]
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      properties: {
        Row: {
          address: string | null
          admin_note: string | null
          approved_at: string | null
          bathrooms: number
          bedrooms: number
          beds: number
          check_in_time: string | null
          check_out_time: string | null
          city_code: string | null
          contact_instagram: string | null
          contact_phone: string | null
          contact_whatsapp: string | null
          created_at: string
          currency: string
          description: string | null
          extra_info: string | null
          house_rules: string | null
          id: string
          is_active: boolean
          is_demo: boolean
          is_featured: boolean
          latitude: number | null
          longitude: number | null
          main_image_url: string | null
          max_guests: number
          name: string
          owner_id: string | null
          price_per_night: number
          property_type: string
          rating: number
          region_code: string | null
          review_count: number
          seo_description: string | null
          seo_title: string | null
          show_exact_location: boolean
          slug: string
          status: Database["public"]["Enums"]["listing_status"]
          submitted_at: string | null
          updated_at: string
          view_count: number
        }
        Insert: {
          address?: string | null
          admin_note?: string | null
          approved_at?: string | null
          bathrooms?: number
          bedrooms?: number
          beds?: number
          check_in_time?: string | null
          check_out_time?: string | null
          city_code?: string | null
          contact_instagram?: string | null
          contact_phone?: string | null
          contact_whatsapp?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          extra_info?: string | null
          house_rules?: string | null
          id?: string
          is_active?: boolean
          is_demo?: boolean
          is_featured?: boolean
          latitude?: number | null
          longitude?: number | null
          main_image_url?: string | null
          max_guests?: number
          name: string
          owner_id?: string | null
          price_per_night?: number
          property_type: string
          rating?: number
          region_code?: string | null
          review_count?: number
          seo_description?: string | null
          seo_title?: string | null
          show_exact_location?: boolean
          slug: string
          status?: Database["public"]["Enums"]["listing_status"]
          submitted_at?: string | null
          updated_at?: string
          view_count?: number
        }
        Update: {
          address?: string | null
          admin_note?: string | null
          approved_at?: string | null
          bathrooms?: number
          bedrooms?: number
          beds?: number
          check_in_time?: string | null
          check_out_time?: string | null
          city_code?: string | null
          contact_instagram?: string | null
          contact_phone?: string | null
          contact_whatsapp?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          extra_info?: string | null
          house_rules?: string | null
          id?: string
          is_active?: boolean
          is_demo?: boolean
          is_featured?: boolean
          latitude?: number | null
          longitude?: number | null
          main_image_url?: string | null
          max_guests?: number
          name?: string
          owner_id?: string | null
          price_per_night?: number
          property_type?: string
          rating?: number
          region_code?: string | null
          review_count?: number
          seo_description?: string | null
          seo_title?: string | null
          show_exact_location?: boolean
          slug?: string
          status?: Database["public"]["Enums"]["listing_status"]
          submitted_at?: string | null
          updated_at?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "properties_city_code_fkey"
            columns: ["city_code"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "properties_property_type_fkey"
            columns: ["property_type"]
            isOneToOne: false
            referencedRelation: "property_types"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "properties_region_code_fkey"
            columns: ["region_code"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["code"]
          },
        ]
      }
      property_amenities: {
        Row: {
          amenity_code: string
          property_id: string
        }
        Insert: {
          amenity_code: string
          property_id: string
        }
        Update: {
          amenity_code?: string
          property_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_amenities_amenity_code_fkey"
            columns: ["amenity_code"]
            isOneToOne: false
            referencedRelation: "amenities"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "property_amenities_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          property_id: string
          user_id: string | null
          visitor_token: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          property_id: string
          user_id?: string | null
          visitor_token: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          property_id?: string
          user_id?: string | null
          visitor_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_events_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_images: {
        Row: {
          created_at: string
          id: string
          image_url: string
          is_cover: boolean
          property_id: string
          sort_order: number
          storage_path: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          is_cover?: boolean
          property_id: string
          sort_order?: number
          storage_path?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          is_cover?: boolean
          property_id?: string
          sort_order?: number
          storage_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_images_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_pricing: {
        Row: {
          base_price: number | null
          created_at: string
          currency: string
          extra_guest_price: number | null
          fixed_price: number | null
          id: string
          included_guests: number
          pricing_type: Database["public"]["Enums"]["pricing_type"]
          property_id: string
          updated_at: string
        }
        Insert: {
          base_price?: number | null
          created_at?: string
          currency?: string
          extra_guest_price?: number | null
          fixed_price?: number | null
          id?: string
          included_guests?: number
          pricing_type?: Database["public"]["Enums"]["pricing_type"]
          property_id: string
          updated_at?: string
        }
        Update: {
          base_price?: number | null
          created_at?: string
          currency?: string
          extra_guest_price?: number | null
          fixed_price?: number | null
          id?: string
          included_guests?: number
          pricing_type?: Database["public"]["Enums"]["pricing_type"]
          property_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_pricing_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: true
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_pricing_tiers: {
        Row: {
          created_at: string
          id: string
          max_guests: number
          min_guests: number
          price_per_night: number
          property_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          max_guests: number
          min_guests: number
          price_per_night: number
          property_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          max_guests?: number
          min_guests?: number
          price_per_night?: number
          property_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "property_pricing_tiers_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_status_history: {
        Row: {
          changed_by: string | null
          created_at: string
          id: string
          new_status: Database["public"]["Enums"]["listing_status"]
          note: string | null
          old_status: Database["public"]["Enums"]["listing_status"] | null
          property_id: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          id?: string
          new_status: Database["public"]["Enums"]["listing_status"]
          note?: string | null
          old_status?: Database["public"]["Enums"]["listing_status"] | null
          property_id: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          id?: string
          new_status?: Database["public"]["Enums"]["listing_status"]
          note?: string | null
          old_status?: Database["public"]["Enums"]["listing_status"] | null
          property_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_status_history_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_types: {
        Row: {
          code: string
          icon: string | null
          name_en: string
          name_hy: string
          name_ru: string
          sort_order: number
        }
        Insert: {
          code: string
          icon?: string | null
          name_en: string
          name_hy: string
          name_ru: string
          sort_order?: number
        }
        Update: {
          code?: string
          icon?: string | null
          name_en?: string
          name_hy?: string
          name_ru?: string
          sort_order?: number
        }
        Relationships: []
      }
      property_units: {
        Row: {
          created_at: string
          id: string
          max_guests: number
          name: string
          price_per_night: number | null
          property_id: string
          quantity: number
        }
        Insert: {
          created_at?: string
          id?: string
          max_guests?: number
          name: string
          price_per_night?: number | null
          property_id: string
          quantity?: number
        }
        Update: {
          created_at?: string
          id?: string
          max_guests?: number
          name?: string
          price_per_night?: number | null
          property_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "property_units_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_views: {
        Row: {
          created_at: string
          id: string
          property_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          property_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          property_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_views_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      regions: {
        Row: {
          code: string
          name_en: string
          name_hy: string
          name_ru: string
          sort_order: number
        }
        Insert: {
          code: string
          name_en: string
          name_hy: string
          name_ru: string
          sort_order?: number
        }
        Update: {
          code?: string
          name_en?: string
          name_hy?: string
          name_ru?: string
          sort_order?: number
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          property_id: string
          rating: number
          status: Database["public"]["Enums"]["review_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          property_id: string
          rating: number
          status?: Database["public"]["Enums"]["review_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          property_id?: string
          rating?: number
          status?: Database["public"]["Enums"]["review_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      search_events: {
        Row: {
          check_in: string | null
          check_out: string | null
          created_at: string
          destination: string | null
          guests: number | null
          id: string
          results_count: number | null
          user_id: string | null
        }
        Insert: {
          check_in?: string | null
          check_out?: string | null
          created_at?: string
          destination?: string | null
          guests?: number | null
          id?: string
          results_count?: number | null
          user_id?: string | null
        }
        Update: {
          check_in?: string | null
          check_out?: string | null
          created_at?: string
          destination?: string | null
          guests?: number | null
          id?: string
          results_count?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      tour_categories: {
        Row: {
          code: string
          icon: string | null
          name_en: string
          name_hy: string
          name_ru: string
          sort_order: number
        }
        Insert: {
          code: string
          icon?: string | null
          name_en: string
          name_hy: string
          name_ru: string
          sort_order?: number
        }
        Update: {
          code?: string
          icon?: string | null
          name_en?: string
          name_hy?: string
          name_ru?: string
          sort_order?: number
        }
        Relationships: []
      }
      tour_images: {
        Row: {
          created_at: string
          id: string
          image_url: string
          is_cover: boolean
          sort_order: number
          storage_path: string | null
          tour_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          is_cover?: boolean
          sort_order?: number
          storage_path?: string | null
          tour_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          is_cover?: boolean
          sort_order?: number
          storage_path?: string | null
          tour_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tour_images_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "tours"
            referencedColumns: ["id"]
          },
        ]
      }
      tours: {
        Row: {
          admin_note: string | null
          category: string | null
          city_code: string | null
          contact_instagram: string | null
          contact_phone: string | null
          contact_whatsapp: string | null
          created_at: string
          currency: string
          description: string | null
          description_hy: string | null
          description_ru: string | null
          duration_hours: number | null
          id: string
          is_demo: boolean
          is_featured: boolean
          latitude: number | null
          location: string | null
          longitude: number | null
          main_image_url: string | null
          max_participants: number
          meeting_point: string | null
          name: string
          name_hy: string | null
          name_ru: string | null
          owner_id: string | null
          price: number
          rating: number
          region_code: string | null
          review_count: number
          seo_description: string | null
          seo_title: string | null
          slug: string
          status: Database["public"]["Enums"]["listing_status"]
          updated_at: string
          view_count: number
        }
        Insert: {
          admin_note?: string | null
          category?: string | null
          city_code?: string | null
          contact_instagram?: string | null
          contact_phone?: string | null
          contact_whatsapp?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          description_hy?: string | null
          description_ru?: string | null
          duration_hours?: number | null
          id?: string
          is_demo?: boolean
          is_featured?: boolean
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          main_image_url?: string | null
          max_participants?: number
          meeting_point?: string | null
          name: string
          name_hy?: string | null
          name_ru?: string | null
          owner_id?: string | null
          price?: number
          rating?: number
          region_code?: string | null
          review_count?: number
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          status?: Database["public"]["Enums"]["listing_status"]
          updated_at?: string
          view_count?: number
        }
        Update: {
          admin_note?: string | null
          category?: string | null
          city_code?: string | null
          contact_instagram?: string | null
          contact_phone?: string | null
          contact_whatsapp?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          description_hy?: string | null
          description_ru?: string | null
          duration_hours?: number | null
          id?: string
          is_demo?: boolean
          is_featured?: boolean
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          main_image_url?: string | null
          max_participants?: number
          meeting_point?: string | null
          name?: string
          name_hy?: string | null
          name_ru?: string | null
          owner_id?: string | null
          price?: number
          rating?: number
          region_code?: string | null
          review_count?: number
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["listing_status"]
          updated_at?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "tours_category_fkey"
            columns: ["category"]
            isOneToOne: false
            referencedRelation: "tour_categories"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "tours_city_code_fkey"
            columns: ["city_code"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "tours_region_code_fkey"
            columns: ["region_code"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["code"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      become_owner: { Args: never; Returns: undefined }
      booking_by_token: {
        Args: { p_booking_id: string; p_token: string }
        Returns: {
          adults: number
          check_in: string
          check_out: string
          children: number
          confirmed_total_price: number
          created_at: string
          currency: string
          decline_reason: string
          id: string
          infants: number
          nightly_price: number
          nights: number
          price_change_note: string
          property_name: string
          property_slug: string
          reference: string
          status: Database["public"]["Enums"]["booking_status"]
          total_price: number
        }[]
      }
      booking_dates_available: {
        Args: {
          p_check_in: string
          p_check_out: string
          p_exclude?: string
          p_property_id: string
        }
        Returns: boolean
      }
      cancel_booking_request: {
        Args: { p_booking_id: string; p_token?: string }
        Returns: boolean
      }
      check_property_availability: {
        Args: { p_check_in: string; p_check_out: string; p_property_id: string }
        Returns: boolean
      }
      create_booking_request: {
        Args: {
          p_adults: number
          p_check_in: string
          p_check_out: string
          p_children: number
          p_email: string
          p_infants: number
          p_message: string
          p_name: string
          p_phone: string
          p_property_id: string
        }
        Returns: {
          booking_id: string
          guest_token: string
          reference: string
        }[]
      }
      increment_property_view: {
        Args: { p_property_id: string }
        Returns: undefined
      }
      property_analytics_daily: {
        Args: { p_from?: string; p_owner_id?: string; p_property_id?: string }
        Returns: {
          contacts: number
          day: string
          views: number
        }[]
      }
      property_analytics_overview: {
        Args: { p_from?: string; p_owner_id?: string; p_property_id?: string }
        Returns: {
          avg_rating: number
          contact_clicks: number
          instagram_clicks: number
          is_active: boolean
          owner_id: string
          phone_clicks: number
          property_id: string
          property_name: string
          review_count: number
          slug: string
          status: Database["public"]["Enums"]["listing_status"]
          total_views: number
          unique_contacted: number
          unique_visitors: number
          whatsapp_clicks: number
        }[]
      }
      property_host: {
        Args: { p_property_id: string }
        Returns: {
          avatar_url: string
          full_name: string
        }[]
      }
      property_reviews: {
        Args: { p_property_id: string }
        Returns: {
          comment: string
          created_at: string
          display_name: string
          id: string
          rating: number
          user_id: string
        }[]
      }
      quote_property_price: {
        Args: { p_guests: number; p_property_id: string }
        Returns: {
          currency: string
          has_price: boolean
          nightly_price: number
        }[]
      }
      respond_booking_request: {
        Args: {
          p_action: string
          p_booking_id: string
          p_confirmed_total?: number
          p_note?: string
          p_reason?: string
        }
        Returns: boolean
      }
      search_properties: {
        Args: {
          p_amenities?: string[]
          p_bedrooms?: number
          p_check_in?: string
          p_check_out?: string
          p_destination?: string
          p_guests?: number
          p_limit?: number
          p_max_price?: number
          p_min_price?: number
          p_min_rating?: number
          p_offset?: number
          p_sort?: string
          p_types?: string[]
        }
        Returns: {
          amenity_codes: string[]
          bathrooms: number
          bedrooms: number
          beds: number
          city_code: string
          currency: string
          id: string
          is_featured: boolean
          latitude: number
          longitude: number
          main_image_url: string
          max_guests: number
          name: string
          price_per_night: number
          property_type: string
          rating: number
          region_code: string
          review_count: number
          slug: string
          total_count: number
        }[]
      }
      track_property_event: {
        Args: {
          p_event_type: string
          p_property_id: string
          p_visitor_token: string
        }
        Returns: boolean
      }
    }
    Enums: {
      account_status: "ACTIVE" | "SUSPENDED"
      app_role: "admin" | "owner" | "traveler"
      availability_status: "AVAILABLE" | "BLOCKED" | "RESERVED"
      booking_status:
        | "PENDING"
        | "ACCEPTED"
        | "DECLINED"
        | "CANCELLED"
        | "COMPLETED"
      contact_type: "PHONE" | "WHATSAPP" | "INSTAGRAM" | "EMAIL" | "TELEGRAM"
      listing_status:
        | "DRAFT"
        | "PENDING_REVIEW"
        | "APPROVED"
        | "REJECTED"
        | "SUSPENDED"
        | "CHANGES_REQUESTED"
      pricing_type: "FIXED" | "TIERED" | "BASE_PLUS_GUEST"
      review_status: "PENDING" | "APPROVED" | "REJECTED"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      account_status: ["ACTIVE", "SUSPENDED"],
      app_role: ["admin", "owner", "traveler"],
      availability_status: ["AVAILABLE", "BLOCKED", "RESERVED"],
      booking_status: [
        "PENDING",
        "ACCEPTED",
        "DECLINED",
        "CANCELLED",
        "COMPLETED",
      ],
      contact_type: ["PHONE", "WHATSAPP", "INSTAGRAM", "EMAIL", "TELEGRAM"],
      listing_status: [
        "DRAFT",
        "PENDING_REVIEW",
        "APPROVED",
        "REJECTED",
        "SUSPENDED",
        "CHANGES_REQUESTED",
      ],
      pricing_type: ["FIXED", "TIERED", "BASE_PLUS_GUEST"],
      review_status: ["PENDING", "APPROVED", "REJECTED"],
    },
  },
} as const
