/**
 * Supabase Database Types (Generated)
 *
 * Auto-generated from the Supabase schema. DO NOT edit by hand.
 * Regenerate with: npm run db:types
 */

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
      areas: {
        Row: {
          city_id: number
          created_at: string
          id: number
          name_ar: string
          name_en: string
          slug: string
          sort_order: number
        }
        Insert: {
          city_id: number
          created_at?: string
          id?: number
          name_ar: string
          name_en: string
          slug: string
          sort_order?: number
        }
        Update: {
          city_id?: number
          created_at?: string
          id?: number
          name_ar?: string
          name_en?: string
          slug?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "areas_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          default_delivery_options: Database["public"]["Enums"]["delivery_option"][]
          icon: string | null
          id: number
          is_active: boolean
          min_photos: number
          name_ar: string
          name_en: string
          parent_id: number | null
          requires_auth_statement: boolean
          requires_video: boolean
          slug: string
          sort_order: number
          tier: Database["public"]["Enums"]["category_tier"] | null
        }
        Insert: {
          created_at?: string
          default_delivery_options?: Database["public"]["Enums"]["delivery_option"][]
          icon?: string | null
          id?: number
          is_active?: boolean
          min_photos?: number
          name_ar: string
          name_en: string
          parent_id?: number | null
          requires_auth_statement?: boolean
          requires_video?: boolean
          slug: string
          sort_order?: number
          tier?: Database["public"]["Enums"]["category_tier"] | null
        }
        Update: {
          created_at?: string
          default_delivery_options?: Database["public"]["Enums"]["delivery_option"][]
          icon?: string | null
          id?: number
          is_active?: boolean
          min_photos?: number
          name_ar?: string
          name_en?: string
          parent_id?: number | null
          requires_auth_statement?: boolean
          requires_video?: boolean
          slug?: string
          sort_order?: number
          tier?: Database["public"]["Enums"]["category_tier"] | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      cities: {
        Row: {
          country_code: string
          created_at: string
          id: number
          is_active: boolean
          name_ar: string
          name_en: string
          slug: string
          sort_order: number
        }
        Insert: {
          country_code: string
          created_at?: string
          id?: number
          is_active?: boolean
          name_ar: string
          name_en: string
          slug: string
          sort_order?: number
        }
        Update: {
          country_code?: string
          created_at?: string
          id?: number
          is_active?: boolean
          name_ar?: string
          name_en?: string
          slug?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "cities_country_code_fkey"
            columns: ["country_code"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["code"]
          },
        ]
      }
      conversations: {
        Row: {
          buyer_archived: boolean
          buyer_blocked: boolean
          buyer_id: string
          buyer_unread_count: number
          created_at: string
          id: number
          last_message_at: string | null
          last_message_preview: string | null
          listing_id: number
          seller_archived: boolean
          seller_blocked: boolean
          seller_id: string
          seller_unread_count: number
          updated_at: string
        }
        Insert: {
          buyer_archived?: boolean
          buyer_blocked?: boolean
          buyer_id: string
          buyer_unread_count?: number
          created_at?: string
          id?: number
          last_message_at?: string | null
          last_message_preview?: string | null
          listing_id: number
          seller_archived?: boolean
          seller_blocked?: boolean
          seller_id: string
          seller_unread_count?: number
          updated_at?: string
        }
        Update: {
          buyer_archived?: boolean
          buyer_blocked?: boolean
          buyer_id?: string
          buyer_unread_count?: number
          created_at?: string
          id?: number
          last_message_at?: string | null
          last_message_preview?: string | null
          listing_id?: number
          seller_archived?: boolean
          seller_blocked?: boolean
          seller_id?: string
          seller_unread_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      countries: {
        Row: {
          code: string
          created_at: string
          currency_code: string
          is_active: boolean
          name_ar: string
          name_en: string
          phone_code: string
          sort_order: number
        }
        Insert: {
          code: string
          created_at?: string
          currency_code: string
          is_active?: boolean
          name_ar: string
          name_en: string
          phone_code: string
          sort_order?: number
        }
        Update: {
          code?: string
          created_at?: string
          currency_code?: string
          is_active?: boolean
          name_ar?: string
          name_en?: string
          phone_code?: string
          sort_order?: number
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          listing_id: number
          user_id: string
        }
        Insert: {
          created_at?: string
          listing_id: number
          user_id: string
        }
        Update: {
          created_at?: string
          listing_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      fraud_events: {
        Row: {
          created_at: string
          details: Json
          event_type: string
          id: number
          listing_id: number | null
          resolution: string | null
          resolution_note: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: number
          user_id: string | null
        }
        Insert: {
          created_at?: string
          details?: Json
          event_type: string
          id?: number
          listing_id?: number | null
          resolution?: string | null
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity: number
          user_id?: string | null
        }
        Update: {
          created_at?: string
          details?: Json
          event_type?: string
          id?: number
          listing_id?: number | null
          resolution?: string | null
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fraud_events_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fraud_events_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fraud_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      image_hashes: {
        Row: {
          first_seen_at: string
          id: number
          listing_id: number | null
          listing_image_id: number | null
          perceptual_hash: number
          source: string
        }
        Insert: {
          first_seen_at?: string
          id?: number
          listing_id?: number | null
          listing_image_id?: number | null
          perceptual_hash: number
          source?: string
        }
        Update: {
          first_seen_at?: string
          id?: number
          listing_id?: number | null
          listing_image_id?: number | null
          perceptual_hash?: number
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "image_hashes_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "image_hashes_listing_image_id_fkey"
            columns: ["listing_image_id"]
            isOneToOne: false
            referencedRelation: "listing_images"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_drafts: {
        Row: {
          area_id: number | null
          authenticity_confirmed: boolean
          brand: string | null
          category_id: number | null
          city_id: number | null
          color: string | null
          condition: Database["public"]["Enums"]["item_condition"] | null
          country_code: string | null
          created_at: string
          currency_code: string | null
          current_step: string
          delivery_options: Database["public"]["Enums"]["delivery_option"][]
          description: string | null
          has_receipt: boolean
          id: string
          image_urls: string[]
          min_offer_minor_units: number | null
          model: string | null
          price_minor_units: number | null
          price_mode: Database["public"]["Enums"]["price_mode"] | null
          serial_number: string | null
          subcategory_id: number | null
          title: string | null
          updated_at: string
          user_id: string
          video_url: string | null
        }
        Insert: {
          area_id?: number | null
          authenticity_confirmed?: boolean
          brand?: string | null
          category_id?: number | null
          city_id?: number | null
          color?: string | null
          condition?: Database["public"]["Enums"]["item_condition"] | null
          country_code?: string | null
          created_at?: string
          currency_code?: string | null
          current_step?: string
          delivery_options?: Database["public"]["Enums"]["delivery_option"][]
          description?: string | null
          has_receipt?: boolean
          id?: string
          image_urls?: string[]
          min_offer_minor_units?: number | null
          model?: string | null
          price_minor_units?: number | null
          price_mode?: Database["public"]["Enums"]["price_mode"] | null
          serial_number?: string | null
          subcategory_id?: number | null
          title?: string | null
          updated_at?: string
          user_id: string
          video_url?: string | null
        }
        Update: {
          area_id?: number | null
          authenticity_confirmed?: boolean
          brand?: string | null
          category_id?: number | null
          city_id?: number | null
          color?: string | null
          condition?: Database["public"]["Enums"]["item_condition"] | null
          country_code?: string | null
          created_at?: string
          currency_code?: string | null
          current_step?: string
          delivery_options?: Database["public"]["Enums"]["delivery_option"][]
          description?: string | null
          has_receipt?: boolean
          id?: string
          image_urls?: string[]
          min_offer_minor_units?: number | null
          model?: string | null
          price_minor_units?: number | null
          price_mode?: Database["public"]["Enums"]["price_mode"] | null
          serial_number?: string | null
          subcategory_id?: number | null
          title?: string | null
          updated_at?: string
          user_id?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "listing_drafts_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_drafts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_drafts_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_drafts_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_drafts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_embeddings: {
        Row: {
          created_at: string
          embedding: string
          listing_id: number
          model_version: string
          source_text: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          embedding: string
          listing_id: number
          model_version?: string
          source_text: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          embedding?: string
          listing_id?: number
          model_version?: string
          source_text?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_embeddings_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: true
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_images: {
        Row: {
          alt_text: string | null
          created_at: string
          full_url: string | null
          height: number
          id: number
          listing_id: number
          medium_url: string | null
          position: number
          thumb_url: string | null
          url: string
          width: number
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          full_url?: string | null
          height: number
          id?: number
          listing_id: number
          medium_url?: string | null
          position: number
          thumb_url?: string | null
          url: string
          width: number
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          full_url?: string | null
          height?: number
          id?: number
          listing_id?: number
          medium_url?: string | null
          position?: number
          thumb_url?: string | null
          url?: string
          width?: number
        }
        Relationships: [
          {
            foreignKeyName: "listing_images_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_videos: {
        Row: {
          created_at: string
          duration_seconds: number | null
          height: number | null
          id: number
          listing_id: number
          poster_url: string | null
          url: string
          width: number | null
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          height?: number | null
          id?: number
          listing_id: number
          poster_url?: string | null
          url: string
          width?: number | null
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          height?: number | null
          id?: number
          listing_id?: number
          poster_url?: string | null
          url?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "listing_videos_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: true
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          ai_any_accepted: boolean | null
          ai_brand_accepted: boolean
          ai_brand_confidence: number | null
          ai_brand_suggested: boolean
          ai_category_accepted: boolean
          ai_category_confidence: number | null
          ai_category_suggested: boolean
          ai_condition_accepted: boolean
          ai_condition_confidence: number | null
          ai_condition_suggested: boolean
          archived_at: string | null
          area_id: number | null
          authenticity_confirmed: boolean
          brand: string | null
          category_fields: Json
          category_id: number
          chat_initiation_count: number
          city_id: number
          color: string | null
          condition: Database["public"]["Enums"]["item_condition"]
          country_code: string
          created_at: string
          currency_code: string
          delivery_options: Database["public"]["Enums"]["delivery_option"][]
          description: string
          description_char_count: number | null
          expires_at: string | null
          fraud_checked_at: string | null
          fraud_flags: Json
          fraud_score: number
          fraud_status: Database["public"]["Enums"]["fraud_status"]
          has_receipt: boolean
          id: number
          is_price_negotiable: boolean | null
          last_renewed_at: string | null
          min_offer_minor_units: number | null
          model: string | null
          post_publish_edit_count: number
          price_minor_units: number
          price_mode: Database["public"]["Enums"]["price_mode"]
          published_at: string | null
          renewed_count: number
          save_count: number
          seller_id: string
          serial_number: string | null
          slug: string
          soft_deleted_at: string | null
          sold_at: string | null
          status: Database["public"]["Enums"]["listing_status"]
          subcategory_id: number | null
          time_to_publish_seconds: number | null
          title: string
          updated_at: string
          view_count: number
        }
        Insert: {
          ai_any_accepted?: boolean | null
          ai_brand_accepted?: boolean
          ai_brand_confidence?: number | null
          ai_brand_suggested?: boolean
          ai_category_accepted?: boolean
          ai_category_confidence?: number | null
          ai_category_suggested?: boolean
          ai_condition_accepted?: boolean
          ai_condition_confidence?: number | null
          ai_condition_suggested?: boolean
          archived_at?: string | null
          area_id?: number | null
          authenticity_confirmed?: boolean
          brand?: string | null
          category_fields?: Json
          category_id: number
          chat_initiation_count?: number
          city_id: number
          color?: string | null
          condition: Database["public"]["Enums"]["item_condition"]
          country_code?: string
          created_at?: string
          currency_code?: string
          delivery_options?: Database["public"]["Enums"]["delivery_option"][]
          description: string
          description_char_count?: number | null
          expires_at?: string | null
          fraud_checked_at?: string | null
          fraud_flags?: Json
          fraud_score?: number
          fraud_status?: Database["public"]["Enums"]["fraud_status"]
          has_receipt?: boolean
          id?: number
          is_price_negotiable?: boolean | null
          last_renewed_at?: string | null
          min_offer_minor_units?: number | null
          model?: string | null
          post_publish_edit_count?: number
          price_minor_units: number
          price_mode: Database["public"]["Enums"]["price_mode"]
          published_at?: string | null
          renewed_count?: number
          save_count?: number
          seller_id: string
          serial_number?: string | null
          slug: string
          soft_deleted_at?: string | null
          sold_at?: string | null
          status?: Database["public"]["Enums"]["listing_status"]
          subcategory_id?: number | null
          time_to_publish_seconds?: number | null
          title: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          ai_any_accepted?: boolean | null
          ai_brand_accepted?: boolean
          ai_brand_confidence?: number | null
          ai_brand_suggested?: boolean
          ai_category_accepted?: boolean
          ai_category_confidence?: number | null
          ai_category_suggested?: boolean
          ai_condition_accepted?: boolean
          ai_condition_confidence?: number | null
          ai_condition_suggested?: boolean
          archived_at?: string | null
          area_id?: number | null
          authenticity_confirmed?: boolean
          brand?: string | null
          category_fields?: Json
          category_id?: number
          chat_initiation_count?: number
          city_id?: number
          color?: string | null
          condition?: Database["public"]["Enums"]["item_condition"]
          country_code?: string
          created_at?: string
          currency_code?: string
          delivery_options?: Database["public"]["Enums"]["delivery_option"][]
          description?: string
          description_char_count?: number | null
          expires_at?: string | null
          fraud_checked_at?: string | null
          fraud_flags?: Json
          fraud_score?: number
          fraud_status?: Database["public"]["Enums"]["fraud_status"]
          has_receipt?: boolean
          id?: number
          is_price_negotiable?: boolean | null
          last_renewed_at?: string | null
          min_offer_minor_units?: number | null
          model?: string | null
          post_publish_edit_count?: number
          price_minor_units?: number
          price_mode?: Database["public"]["Enums"]["price_mode"]
          published_at?: string | null
          renewed_count?: number
          save_count?: number
          seller_id?: string
          serial_number?: string | null
          slug?: string
          soft_deleted_at?: string | null
          sold_at?: string | null
          status?: Database["public"]["Enums"]["listing_status"]
          subcategory_id?: number | null
          time_to_publish_seconds?: number | null
          title?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "listings_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_country_code_fkey"
            columns: ["country_code"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "listings_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string | null
          conversation_id: number
          created_at: string
          id: number
          media_type: string | null
          media_url: string | null
          offer_amount_minor: number | null
          offer_currency: string | null
          read_at: string | null
          sender_id: string
          sent_as_offer: boolean
        }
        Insert: {
          body?: string | null
          conversation_id: number
          created_at?: string
          id?: number
          media_type?: string | null
          media_url?: string | null
          offer_amount_minor?: number | null
          offer_currency?: string | null
          read_at?: string | null
          sender_id: string
          sent_as_offer?: boolean
        }
        Update: {
          body?: string | null
          conversation_id?: number
          created_at?: string
          id?: number
          media_type?: string | null
          media_url?: string | null
          offer_amount_minor?: number | null
          offer_currency?: string | null
          read_at?: string | null
          sender_id?: string
          sent_as_offer?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active_listings_count: number
          avatar_url: string | null
          ban_reason: string | null
          bio: string | null
          country_code: string
          created_at: string
          dealer_name: string | null
          dealer_verified_at: string | null
          display_name: string
          email: string | null
          handle: string | null
          id: string
          id_verified_at: string | null
          is_banned: boolean
          is_dealer: boolean
          is_founding_partner: boolean
          last_active_at: string
          phone_e164: string | null
          phone_verified_at: string | null
          preferred_locale: string
          rating_avg: number | null
          rating_count: number
          sold_listings_count: number
          updated_at: string
        }
        Insert: {
          active_listings_count?: number
          avatar_url?: string | null
          ban_reason?: string | null
          bio?: string | null
          country_code?: string
          created_at?: string
          dealer_name?: string | null
          dealer_verified_at?: string | null
          display_name: string
          email?: string | null
          handle?: string | null
          id: string
          id_verified_at?: string | null
          is_banned?: boolean
          is_dealer?: boolean
          is_founding_partner?: boolean
          last_active_at?: string
          phone_e164?: string | null
          phone_verified_at?: string | null
          preferred_locale?: string
          rating_avg?: number | null
          rating_count?: number
          sold_listings_count?: number
          updated_at?: string
        }
        Update: {
          active_listings_count?: number
          avatar_url?: string | null
          ban_reason?: string | null
          bio?: string | null
          country_code?: string
          created_at?: string
          dealer_name?: string | null
          dealer_verified_at?: string | null
          display_name?: string
          email?: string | null
          handle?: string | null
          id?: string
          id_verified_at?: string | null
          is_banned?: boolean
          is_dealer?: boolean
          is_founding_partner?: boolean
          last_active_at?: string
          phone_e164?: string | null
          phone_verified_at?: string | null
          preferred_locale?: string
          rating_avg?: number | null
          rating_count?: number
          sold_listings_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_country_code_fkey"
            columns: ["country_code"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["code"]
          },
        ]
      }
      ratings: {
        Row: {
          comment: string | null
          created_at: string
          id: number
          listing_id: number
          rated_id: string
          rater_id: string
          role: string
          score: number
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: number
          listing_id: number
          rated_id: string
          rater_id: string
          role: string
          score: number
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: number
          listing_id?: number
          rated_id?: string
          rater_id?: string
          role?: string
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "ratings_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_rated_id_fkey"
            columns: ["rated_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_rater_id_fkey"
            columns: ["rater_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string
          details: string | null
          id: number
          reason: Database["public"]["Enums"]["report_reason"]
          reporter_id: string
          resolution_note: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: Database["public"]["Enums"]["report_status"]
          target_listing_id: number | null
          target_type: string
          target_user_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: number
          reason: Database["public"]["Enums"]["report_reason"]
          reporter_id: string
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          target_listing_id?: number | null
          target_type: string
          target_user_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: number
          reason?: Database["public"]["Enums"]["report_reason"]
          reporter_id?: string
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          target_listing_id?: number | null
          target_type?: string
          target_user_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_target_listing_id_fkey"
            columns: ["target_listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      waitlist: {
        Row: {
          confirmed_at: string | null
          converted_at: string | null
          converted_to_user_id: string | null
          country_code: string
          created_at: string
          email: string
          id: number
          is_buyer: boolean
          is_confirmed: boolean
          is_seller: boolean
          preferred_locale: string
          primary_interest: string | null
          referrer_url: string | null
          updated_at: string
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          confirmed_at?: string | null
          converted_at?: string | null
          converted_to_user_id?: string | null
          country_code?: string
          created_at?: string
          email: string
          id?: number
          is_buyer?: boolean
          is_confirmed?: boolean
          is_seller?: boolean
          preferred_locale?: string
          primary_interest?: string | null
          referrer_url?: string | null
          updated_at?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          confirmed_at?: string | null
          converted_at?: string | null
          converted_to_user_id?: string | null
          country_code?: string
          created_at?: string
          email?: string
          id?: number
          is_buyer?: boolean
          is_confirmed?: boolean
          is_seller?: boolean
          preferred_locale?: string
          primary_interest?: string | null
          referrer_url?: string | null
          updated_at?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "waitlist_converted_to_user_id_fkey"
            columns: ["converted_to_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waitlist_country_code_fkey"
            columns: ["country_code"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["code"]
          },
        ]
      }
    }
    Views: {
      category_pricing_stats: {
        Row: {
          category_id: number | null
          condition: Database["public"]["Enums"]["item_condition"] | null
          country_code: string | null
          currency_code: string | null
          last_sample_at: string | null
          median_minor: number | null
          p25_minor: number | null
          p75_minor: number | null
          sample_size: number | null
        }
        Relationships: [
          {
            foreignKeyName: "listings_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_country_code_fkey"
            columns: ["country_code"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["code"]
          },
        ]
      }
    }
    Functions: {
      active_country_codes: { Args: never; Returns: string[] }
      category_path: {
        Args: { cat_id: number }
        Returns: {
          id: number
          name_ar: string
          name_en: string
          slug: string
        }[]
      }
      expire_listings: {
        Args: never
        Returns: {
          listing_id: number
        }[]
      }
      hamming_distance: { Args: { a: number; b: number }; Returns: number }
      search_listings_semantic: {
        Args: {
          category_filter?: number
          country_filter?: string
          max_results?: number
          query_embedding: string
        }
        Returns: {
          listing_id: number
          similarity: number
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      soft_delete_old_archives: {
        Args: never
        Returns: {
          listing_id: number
        }[]
      }
      unaccent: { Args: { "": string }; Returns: string }
    }
    Enums: {
      category_tier: "p0" | "p1" | "p2"
      delivery_option: "pickup" | "seller_delivers" | "buyer_ships"
      fraud_status:
        | "pending"
        | "clean"
        | "flagged"
        | "held"
        | "approved_manual"
        | "rejected"
      item_condition:
        | "new"
        | "new_with_tags"
        | "like_new"
        | "excellent_used"
        | "good_used"
        | "fair_used"
      listing_status:
        | "draft"
        | "live"
        | "archived"
        | "deleted"
        | "sold"
        | "held"
        | "rejected"
      price_mode: "fixed" | "negotiable" | "best_offer"
      report_reason:
        | "spam"
        | "fraud_scam"
        | "prohibited_item"
        | "stolen_goods"
        | "counterfeit"
        | "misleading_info"
        | "inappropriate_content"
        | "harassment"
        | "other"
      report_status: "pending" | "reviewing" | "resolved" | "dismissed"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      category_tier: ["p0", "p1", "p2"],
      delivery_option: ["pickup", "seller_delivers", "buyer_ships"],
      fraud_status: [
        "pending",
        "clean",
        "flagged",
        "held",
        "approved_manual",
        "rejected",
      ],
      item_condition: [
        "new",
        "new_with_tags",
        "like_new",
        "excellent_used",
        "good_used",
        "fair_used",
      ],
      listing_status: [
        "draft",
        "live",
        "archived",
        "deleted",
        "sold",
        "held",
        "rejected",
      ],
      price_mode: ["fixed", "negotiable", "best_offer"],
      report_reason: [
        "spam",
        "fraud_scam",
        "prohibited_item",
        "stolen_goods",
        "counterfeit",
        "misleading_info",
        "inappropriate_content",
        "harassment",
        "other",
      ],
      report_status: ["pending", "reviewing", "resolved", "dismissed"],
    },
  },
} as const
