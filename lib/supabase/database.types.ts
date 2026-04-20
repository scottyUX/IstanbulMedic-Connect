export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      analyses: {
        Row: {
          analyzed_at: string
          commit_sha: string | null
          id: string
          repo_url: string
          report_json: Json
          result_id: string
          summary_json: Json | null
        }
        Insert: {
          analyzed_at?: string
          commit_sha?: string | null
          id?: string
          repo_url: string
          report_json: Json
          result_id: string
          summary_json?: Json | null
        }
        Update: {
          analyzed_at?: string
          commit_sha?: string | null
          id?: string
          repo_url?: string
          report_json?: Json
          result_id?: string
          summary_json?: Json | null
        }
        Relationships: []
      }
      clinic_credentials: {
        Row: {
          clinic_id: string
          credential_id: number | null
          credential_name: string
          credential_type: Database["public"]["Enums"]["clinic_credential_types"]
          id: string
          issuing_body: string | null
          valid_from: string | null
          valid_to: string | null
        }
        Insert: {
          clinic_id: string
          credential_id?: number | null
          credential_name: string
          credential_type: Database["public"]["Enums"]["clinic_credential_types"]
          id?: string
          issuing_body?: string | null
          valid_from?: string | null
          valid_to?: string | null
        }
        Update: {
          clinic_id?: string
          credential_id?: number | null
          credential_name?: string
          credential_type?: Database["public"]["Enums"]["clinic_credential_types"]
          id?: string
          issuing_body?: string | null
          valid_from?: string | null
          valid_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clinic_credentials_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_facts: {
        Row: {
          clinic_id: string
          computed_by: Database["public"]["Enums"]["computed_by_enum"]
          confidence: number
          fact_key: string
          fact_value: Json
          first_seen_at: string
          id: string
          is_conflicting: boolean
          last_seen_at: string
          value_type: Database["public"]["Enums"]["value_type_enum"]
        }
        Insert: {
          clinic_id: string
          computed_by: Database["public"]["Enums"]["computed_by_enum"]
          confidence: number
          fact_key: string
          fact_value: Json
          first_seen_at?: string
          id?: string
          is_conflicting: boolean
          last_seen_at?: string
          value_type: Database["public"]["Enums"]["value_type_enum"]
        }
        Update: {
          clinic_id?: string
          computed_by?: Database["public"]["Enums"]["computed_by_enum"]
          confidence?: number
          fact_key?: string
          fact_value?: Json
          first_seen_at?: string
          id?: string
          is_conflicting?: boolean
          last_seen_at?: string
          value_type?: Database["public"]["Enums"]["value_type_enum"]
        }
        Relationships: [
          {
            foreignKeyName: "clinic_facts_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_forum_profiles: {
        Row: {
          id: string
          clinic_id: string
          forum_source: Database["public"]["Enums"]["forum_source_enum"]
          summary: string | null
          thread_count: number
          photo_thread_count: number
          longterm_thread_count: number
          repair_mention_count: number
          unique_authors_count: number | null
          last_thread_at: string | null
          confidence_score: number | null
          sentiment_score: number | null
          sentiment_distribution: Json
          common_concerns: string[]
          notable_threads: Json
          is_stale: boolean
          captured_at: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          clinic_id: string
          forum_source: Database["public"]["Enums"]["forum_source_enum"]
          summary?: string | null
          thread_count?: number
          photo_thread_count?: number
          longterm_thread_count?: number
          repair_mention_count?: number
          unique_authors_count?: number | null
          last_thread_at?: string | null
          confidence_score?: number | null
          sentiment_score?: number | null
          sentiment_distribution?: Json
          common_concerns?: string[]
          notable_threads?: Json
          is_stale?: boolean
          captured_at?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          clinic_id?: string
          forum_source?: Database["public"]["Enums"]["forum_source_enum"]
          summary?: string | null
          thread_count?: number
          photo_thread_count?: number
          longterm_thread_count?: number
          repair_mention_count?: number
          unique_authors_count?: number | null
          last_thread_at?: string | null
          confidence_score?: number | null
          sentiment_score?: number | null
          sentiment_distribution?: Json
          common_concerns?: string[]
          notable_threads?: Json
          is_stale?: boolean
          captured_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinic_forum_profiles_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_google_places: {
        Row: {
          clinic_id: string
          created_at: string | null
          id: string
          last_checked_at: string | null
          place_id: string
          rating: number | null
          updated_at: string | null
          user_ratings_total: number | null
        }
        Insert: {
          clinic_id: string
          created_at?: string | null
          id?: string
          last_checked_at?: string | null
          place_id: string
          rating?: number | null
          updated_at?: string | null
          user_ratings_total?: number | null
        }
        Update: {
          clinic_id?: string
          created_at?: string | null
          id?: string
          last_checked_at?: string | null
          place_id?: string
          rating?: number | null
          updated_at?: string | null
          user_ratings_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "clinic_google_places_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_instagram_posts: {
        Row: {
          caption: string | null
          captured_at: string
          clinic_id: string
          comments_count: number | null
          comments_data: Json | null
          display_url: string | null
          first_comment_text: string | null
          hashtags: string[] | null
          id: string
          instagram_post_id: string
          likes_count: number | null
          post_type: Database["public"]["Enums"]["instagram_post_type"]
          posted_at: string | null
          short_code: string
          source_id: string
          url: string
        }
        Insert: {
          caption?: string | null
          captured_at?: string
          clinic_id: string
          comments_count?: number | null
          comments_data?: Json | null
          display_url?: string | null
          first_comment_text?: string | null
          hashtags?: string[] | null
          id?: string
          instagram_post_id: string
          likes_count?: number | null
          post_type: Database["public"]["Enums"]["instagram_post_type"]
          posted_at?: string | null
          short_code: string
          source_id: string
          url: string
        }
        Update: {
          caption?: string | null
          captured_at?: string
          clinic_id?: string
          comments_count?: number | null
          comments_data?: Json | null
          display_url?: string | null
          first_comment_text?: string | null
          hashtags?: string[] | null
          id?: string
          instagram_post_id?: string
          likes_count?: number | null
          post_type?: Database["public"]["Enums"]["instagram_post_type"]
          posted_at?: string | null
          short_code?: string
          source_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinic_instagram_posts_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinic_instagram_posts_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_languages: {
        Row: {
          clinic_id: string
          id: string
          language: Database["public"]["Enums"]["clinic_language_types"]
          support_type: Database["public"]["Enums"]["clinic_language_support_types"]
        }
        Insert: {
          clinic_id: string
          id?: string
          language: Database["public"]["Enums"]["clinic_language_types"]
          support_type: Database["public"]["Enums"]["clinic_language_support_types"]
        }
        Update: {
          clinic_id?: string
          id?: string
          language?: Database["public"]["Enums"]["clinic_language_types"]
          support_type?: Database["public"]["Enums"]["clinic_language_support_types"]
        }
        Relationships: [
          {
            foreignKeyName: "clinic_languages_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_locations: {
        Row: {
          address_line: string
          city: string
          clinic_id: string
          country: string
          id: string
          is_primary: boolean
          latitude: number | null
          location_name: string
          longitude: number | null
          opening_hours: Json | null
          payment_methods: string[] | null
          postal_code: string
        }
        Insert: {
          address_line: string
          city: string
          clinic_id: string
          country: string
          id?: string
          is_primary: boolean
          latitude?: number | null
          location_name: string
          longitude?: number | null
          opening_hours?: Json | null
          payment_methods?: string[] | null
          postal_code: string
        }
        Update: {
          address_line?: string
          city?: string
          clinic_id?: string
          country?: string
          id?: string
          is_primary?: boolean
          latitude?: number | null
          location_name?: string
          longitude?: number | null
          opening_hours?: Json | null
          payment_methods?: string[] | null
          postal_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinic_locations_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_media: {
        Row: {
          alt_text: string | null
          caption: string | null
          clinic_id: string
          created_at: string | null
          display_order: number | null
          id: string
          is_primary: boolean | null
          media_type: string
          source_id: string | null
          uploaded_at: string | null
          url: string
        }
        Insert: {
          alt_text?: string | null
          caption?: string | null
          clinic_id: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_primary?: boolean | null
          media_type: string
          source_id?: string | null
          uploaded_at?: string | null
          url: string
        }
        Update: {
          alt_text?: string | null
          caption?: string | null
          clinic_id?: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_primary?: boolean | null
          media_type?: string
          source_id?: string | null
          uploaded_at?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinic_media_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinic_media_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_mentions: {
        Row: {
          clinic_id: string | null
          created_at: string
          id: string
          mention_text: string
          sentiment: Database["public"]["Enums"]["sentiment_enum"] | null
          source_id: string
          topic: Database["public"]["Enums"]["mention_topic_enum"]
        }
        Insert: {
          clinic_id?: string | null
          created_at?: string
          id?: string
          mention_text: string
          sentiment?: Database["public"]["Enums"]["sentiment_enum"] | null
          source_id: string
          topic: Database["public"]["Enums"]["mention_topic_enum"]
        }
        Update: {
          clinic_id?: string | null
          created_at?: string
          id?: string
          mention_text?: string
          sentiment?: Database["public"]["Enums"]["sentiment_enum"] | null
          source_id?: string
          topic?: Database["public"]["Enums"]["mention_topic_enum"]
        }
        Relationships: [
          {
            foreignKeyName: "clinic_mentions_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinic_mentions_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_packages: {
        Row: {
          aftercare_duration_days: number | null
          clinic_id: string
          currency: string | null
          excludes: Json
          id: string
          includes: Json
          nights_included: number | null
          package_name: string
          price_max: number | null
          price_min: number | null
          transport_included: boolean
        }
        Insert: {
          aftercare_duration_days?: number | null
          clinic_id?: string
          currency?: string | null
          excludes: Json
          id?: string
          includes: Json
          nights_included?: number | null
          package_name: string
          price_max?: number | null
          price_min?: number | null
          transport_included: boolean
        }
        Update: {
          aftercare_duration_days?: number | null
          clinic_id?: string
          currency?: string | null
          excludes?: Json
          id?: string
          includes?: Json
          nights_included?: number | null
          package_name?: string
          price_max?: number | null
          price_min?: number | null
          transport_included?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "clinic_packages_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_pricing: {
        Row: {
          clinic_id: string
          currency: string | null
          id: string
          is_verified: boolean | null
          last_verified_at: string | null
          notes: string | null
          price_max: number | null
          price_min: number | null
          pricing_type: Database["public"]["Enums"]["clinic_pricing_type"]
          service_name: string
          source_id: string | null
        }
        Insert: {
          clinic_id?: string
          currency?: string | null
          id?: string
          is_verified?: boolean | null
          last_verified_at?: string | null
          notes?: string | null
          price_max?: number | null
          price_min?: number | null
          pricing_type: Database["public"]["Enums"]["clinic_pricing_type"]
          service_name: string
          source_id?: string | null
        }
        Update: {
          clinic_id?: string
          currency?: string | null
          id?: string
          is_verified?: boolean | null
          last_verified_at?: string | null
          notes?: string | null
          price_max?: number | null
          price_min?: number | null
          pricing_type?: Database["public"]["Enums"]["clinic_pricing_type"]
          service_name?: string
          source_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clinic_pricing_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinic_pricing_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_reviews: {
        Row: {
          clinic_id: string
          id: string
          language: string | null
          rating: string | null
          review_date: string | null
          review_text: string
          source_id: string
        }
        Insert: {
          clinic_id: string
          id?: string
          language?: string | null
          rating?: string | null
          review_date?: string | null
          review_text: string
          source_id: string
        }
        Update: {
          clinic_id?: string
          id?: string
          language?: string | null
          rating?: string | null
          review_date?: string | null
          review_text?: string
          source_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinic_reviews_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinic_reviews_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_score_components: {
        Row: {
          clinic_id: string
          component_key: string
          computed_at: string
          explanation: string
          id: string
          score: number
          weight: number
        }
        Insert: {
          clinic_id: string
          component_key: string
          computed_at?: string
          explanation: string
          id?: string
          score: number
          weight: number
        }
        Update: {
          clinic_id?: string
          component_key?: string
          computed_at?: string
          explanation?: string
          id?: string
          score?: number
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "clinic_score_components_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_scores: {
        Row: {
          band: Database["public"]["Enums"]["score_band_enum"]
          clinic_id: string
          computed_at: string
          overall_score: number
          version: string
        }
        Insert: {
          band: Database["public"]["Enums"]["score_band_enum"]
          clinic_id: string
          computed_at?: string
          overall_score: number
          version: string
        }
        Update: {
          band?: Database["public"]["Enums"]["score_band_enum"]
          clinic_id?: string
          computed_at?: string
          overall_score?: number
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinic_scores_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: true
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_services: {
        Row: {
          clinic_id: string
          id: string
          is_primary_service: boolean
          service_category: Database["public"]["Enums"]["clinic_service_category"]
          service_name: Database["public"]["Enums"]["clinic_service_name"]
        }
        Insert: {
          clinic_id: string
          id?: string
          is_primary_service: boolean
          service_category: Database["public"]["Enums"]["clinic_service_category"]
          service_name: Database["public"]["Enums"]["clinic_service_name"]
        }
        Update: {
          clinic_id?: string
          id?: string
          is_primary_service?: boolean
          service_category?: Database["public"]["Enums"]["clinic_service_category"]
          service_name?: Database["public"]["Enums"]["clinic_service_name"]
        }
        Relationships: [
          {
            foreignKeyName: "clinic_services_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_social_media: {
        Row: {
          account_handle: string
          biography: string | null
          business_category: string | null
          clinic_id: string
          created_at: string | null
          external_urls: string[] | null
          follower_count: number | null
          follows_count: number | null
          full_name: string | null
          highlights_count: number | null
          id: string
          is_private: boolean | null
          last_checked_at: string | null
          platform: Database["public"]["Enums"]["social_platform_enum"]
          posts_count: number | null
          profile_pic_url: string | null
          verified: boolean | null
        }
        Insert: {
          account_handle: string
          biography?: string | null
          business_category?: string | null
          clinic_id: string
          created_at?: string | null
          external_urls?: string[] | null
          follower_count?: number | null
          follows_count?: number | null
          full_name?: string | null
          highlights_count?: number | null
          id?: string
          is_private?: boolean | null
          last_checked_at?: string | null
          platform: Database["public"]["Enums"]["social_platform_enum"]
          posts_count?: number | null
          profile_pic_url?: string | null
          verified?: boolean | null
        }
        Update: {
          account_handle?: string
          biography?: string | null
          business_category?: string | null
          clinic_id?: string
          created_at?: string | null
          external_urls?: string[] | null
          follower_count?: number | null
          follows_count?: number | null
          full_name?: string | null
          highlights_count?: number | null
          id?: string
          is_private?: boolean | null
          last_checked_at?: string | null
          platform?: Database["public"]["Enums"]["social_platform_enum"]
          posts_count?: number | null
          profile_pic_url?: string | null
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "clinic_social_media_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_team: {
        Row: {
          clinic_id: string
          credentials: string
          doctor_involvement_level: Database["public"]["Enums"]["doctor_involvement_levels"]
          id: string
          name: string | null
          photo_url: string | null
          role: Database["public"]["Enums"]["clinic_roles"]
          years_experience: number | null
        }
        Insert: {
          clinic_id: string
          credentials: string
          doctor_involvement_level: Database["public"]["Enums"]["doctor_involvement_levels"]
          id?: string
          name?: string | null
          photo_url?: string | null
          role: Database["public"]["Enums"]["clinic_roles"]
          years_experience?: number | null
        }
        Update: {
          clinic_id?: string
          credentials?: string
          doctor_involvement_level?: Database["public"]["Enums"]["doctor_involvement_levels"]
          id?: string
          name?: string | null
          photo_url?: string | null
          role?: Database["public"]["Enums"]["clinic_roles"]
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "clinic_team_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      clinics: {
        Row: {
          created_at: string
          description: string | null
          display_name: string
          email_contact: string | null
          id: string
          legal_name: string | null
          phone_contact: string | null
          primary_city: string
          primary_country: string
          procedures_performed: number | null
          short_description: string | null
          status: Database["public"]["Enums"]["clinic_status"]
          thumbnail_url: string | null
          updated_at: string
          website_url: string | null
          whatsapp_contact: string | null
          years_in_operation: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_name: string
          email_contact?: string | null
          id?: string
          legal_name?: string | null
          phone_contact?: string | null
          primary_city: string
          primary_country: string
          procedures_performed?: number | null
          short_description?: string | null
          status: Database["public"]["Enums"]["clinic_status"]
          thumbnail_url?: string | null
          updated_at?: string
          website_url?: string | null
          whatsapp_contact?: string | null
          years_in_operation?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          display_name?: string
          email_contact?: string | null
          id?: string
          legal_name?: string | null
          phone_contact?: string | null
          primary_city?: string
          primary_country?: string
          procedures_performed?: number | null
          short_description?: string | null
          status?: Database["public"]["Enums"]["clinic_status"]
          thumbnail_url?: string | null
          updated_at?: string
          website_url?: string | null
          whatsapp_contact?: string | null
          years_in_operation?: number | null
        }
        Relationships: []
      }
      fact_evidence: {
        Row: {
          clinic_fact_id: string
          evidence_locator: Json | null
          evidence_snippet: string | null
          id: string
          source_document_id: string
        }
        Insert: {
          clinic_fact_id: string
          evidence_locator?: Json | null
          evidence_snippet?: string | null
          id?: string
          source_document_id: string
        }
        Update: {
          clinic_fact_id?: string
          evidence_locator?: Json | null
          evidence_snippet?: string | null
          id?: string
          source_document_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fact_evidence_clinic_fact_id_fkey"
            columns: ["clinic_fact_id"]
            isOneToOne: false
            referencedRelation: "clinic_facts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fact_evidence_source_document_id_fkey"
            columns: ["source_document_id"]
            isOneToOne: false
            referencedRelation: "source_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      source_documents: {
        Row: {
          doc_type: Database["public"]["Enums"]["doc_type_enum"]
          id: string
          language: string | null
          published_at: string | null
          raw_text: string
          source_id: string
          title: string | null
        }
        Insert: {
          doc_type: Database["public"]["Enums"]["doc_type_enum"]
          id?: string
          language?: string | null
          published_at?: string | null
          raw_text: string
          source_id: string
          title?: string | null
        }
        Update: {
          doc_type?: Database["public"]["Enums"]["doc_type_enum"]
          id?: string
          language?: string | null
          published_at?: string | null
          raw_text?: string
          source_id?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "source_documents_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      sources: {
        Row: {
          author_handle: string | null
          captured_at: string
          content_hash: string | null
          id: string
          source_name: string
          source_type: Database["public"]["Enums"]["source_type_enum"]
          url: string | null
        }
        Insert: {
          author_handle?: string | null
          captured_at?: string
          content_hash?: string | null
          id?: string
          source_name: string
          source_type: Database["public"]["Enums"]["source_type_enum"]
          url?: string | null
        }
        Update: {
          author_handle?: string | null
          captured_at?: string
          content_hash?: string | null
          id?: string
          source_name?: string
          source_type?: Database["public"]["Enums"]["source_type_enum"]
          url?: string | null
        }
        Relationships: []
      }
      user_photos: {
        Row: {
          deleted: boolean | null
          file_size_bytes: number | null
          id: string
          mime_type: string | null
          photo_view: Database["public"]["Enums"]["photo_view"]
          storage_url: string
          uploaded_at: string | null
          user_id: string
        }
        Insert: {
          deleted?: boolean | null
          file_size_bytes?: number | null
          id?: string
          mime_type?: string | null
          photo_view: Database["public"]["Enums"]["photo_view"]
          storage_url: string
          uploaded_at?: string | null
          user_id: string
        }
        Update: {
          deleted?: boolean | null
          file_size_bytes?: number | null
          id?: string
          mime_type?: string | null
          photo_view?: Database["public"]["Enums"]["photo_view"]
          storage_url?: string
          uploaded_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_photos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_prior_surgeries: {
        Row: {
          created_at: string | null
          id: string
          notes: string | null
          surgery_type: string
          user_id: string
          year: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          notes?: string | null
          surgery_type: string
          user_id: string
          year: number
        }
        Update: {
          created_at?: string | null
          id?: string
          notes?: string | null
          surgery_type?: string
          user_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_prior_surgeries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_prior_transplants: {
        Row: {
          clinic_country: string | null
          created_at: string | null
          estimated_grafts: number | null
          id: string
          user_id: string
          year: number
        }
        Insert: {
          clinic_country?: string | null
          created_at?: string | null
          estimated_grafts?: number | null
          id?: string
          user_id: string
          year: number
        }
        Update: {
          clinic_country?: string | null
          created_at?: string | null
          estimated_grafts?: number | null
          id?: string
          user_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_prior_transplants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          created_at: string | null
          date_of_birth: string | null
          deleted: boolean | null
          first_name: string
          gender: string | null
          id: string
          last_name: string
          nationality: string | null
          preferred_language: string | null
          profile_picture_url: string | null
          timezone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          date_of_birth?: string | null
          deleted?: boolean | null
          first_name: string
          gender?: string | null
          id?: string
          last_name: string
          nationality?: string | null
          preferred_language?: string | null
          profile_picture_url?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          date_of_birth?: string | null
          deleted?: boolean | null
          first_name?: string
          gender?: string | null
          id?: string
          last_name?: string
          nationality?: string | null
          preferred_language?: string | null
          profile_picture_url?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_qualification: {
        Row: {
          age_tier: Database["public"]["Enums"]["age_tier"] | null
          budget_tier: Database["public"]["Enums"]["budget_tier"] | null
          consent_given: boolean
          country: string | null
          created_at: string | null
          deleted: boolean | null
          hair_loss_pattern:
            | Database["public"]["Enums"]["hair_loss_pattern"]
            | null
          id: string
          preferred_language: string | null
          terms_accepted: boolean
          timeline: Database["public"]["Enums"]["treatment_timeline"] | null
          updated_at: string | null
          user_id: string
          whatsapp_number: string | null
        }
        Insert: {
          age_tier?: Database["public"]["Enums"]["age_tier"] | null
          budget_tier?: Database["public"]["Enums"]["budget_tier"] | null
          consent_given?: boolean
          country?: string | null
          created_at?: string | null
          deleted?: boolean | null
          hair_loss_pattern?:
            | Database["public"]["Enums"]["hair_loss_pattern"]
            | null
          id?: string
          preferred_language?: string | null
          terms_accepted?: boolean
          timeline?: Database["public"]["Enums"]["treatment_timeline"] | null
          updated_at?: string | null
          user_id: string
          whatsapp_number?: string | null
        }
        Update: {
          age_tier?: Database["public"]["Enums"]["age_tier"] | null
          budget_tier?: Database["public"]["Enums"]["budget_tier"] | null
          consent_given?: boolean
          country?: string | null
          created_at?: string | null
          deleted?: boolean | null
          hair_loss_pattern?:
            | Database["public"]["Enums"]["hair_loss_pattern"]
            | null
          id?: string
          preferred_language?: string | null
          terms_accepted?: boolean
          timeline?: Database["public"]["Enums"]["treatment_timeline"] | null
          updated_at?: string | null
          user_id?: string
          whatsapp_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_qualification_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_treatment_profiles: {
        Row: {
          allergies: string[] | null
          created_at: string | null
          deleted: boolean | null
          desired_density: Database["public"]["Enums"]["desired_density"] | null
          donor_area_availability:
            | Database["public"]["Enums"]["donor_area_availability"]
            | null
          donor_area_quality:
            | Database["public"]["Enums"]["donor_area_quality"]
            | null
          had_prior_transplant: boolean | null
          hair_loss_duration_years: number | null
          id: string
          medications: string[] | null
          norwood_scale: number | null
          other_conditions: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          allergies?: string[] | null
          created_at?: string | null
          deleted?: boolean | null
          desired_density?:
            | Database["public"]["Enums"]["desired_density"]
            | null
          donor_area_availability?:
            | Database["public"]["Enums"]["donor_area_availability"]
            | null
          donor_area_quality?:
            | Database["public"]["Enums"]["donor_area_quality"]
            | null
          had_prior_transplant?: boolean | null
          hair_loss_duration_years?: number | null
          id?: string
          medications?: string[] | null
          norwood_scale?: number | null
          other_conditions?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          allergies?: string[] | null
          created_at?: string | null
          deleted?: boolean | null
          desired_density?:
            | Database["public"]["Enums"]["desired_density"]
            | null
          donor_area_availability?:
            | Database["public"]["Enums"]["donor_area_availability"]
            | null
          donor_area_quality?:
            | Database["public"]["Enums"]["donor_area_quality"]
            | null
          had_prior_transplant?: boolean | null
          hair_loss_duration_years?: number | null
          id?: string
          medications?: string[] | null
          norwood_scale?: number | null
          other_conditions?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_treatment_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          auth_id: string | null
          created_at: string | null
          deleted: boolean | null
          email: string | null
          id: string
          name: string | null
          phone_number: string | null
          updated_at: string | null
        }
        Insert: {
          auth_id?: string | null
          created_at?: string | null
          deleted?: boolean | null
          email?: string | null
          id?: string
          name?: string | null
          phone_number?: string | null
          updated_at?: string | null
        }
        Update: {
          auth_id?: string | null
          created_at?: string | null
          deleted?: boolean | null
          email?: string | null
          id?: string
          name?: string | null
          phone_number?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      upsert_clinic_facts: {
        Args: { facts_data: Json }
        Returns: {
          clinic_id: string
          computed_by: Database["public"]["Enums"]["computed_by_enum"]
          confidence: number
          fact_key: string
          fact_value: Json
          first_seen_at: string
          id: string
          is_conflicting: boolean
          last_seen_at: string
          value_type: Database["public"]["Enums"]["value_type_enum"]
        }[]
        SetofOptions: {
          from: "*"
          to: "clinic_facts"
          isOneToOne: false
          isSetofReturn: true
        }
      }
    }
    Enums: {
      age_tier: "18_24" | "25_34" | "35_44" | "45_54" | "55_64" | "65_plus"
      budget_tier:
        | "under_2000"
        | "2000_5000"
        | "5000_8000"
        | "8000_12000"
        | "12000_plus"
      clinic_credential_types:
        | "license"
        | "accreditation"
        | "membership"
        | "registry_id"
        | "other"
      clinic_language_support_types: "staff" | "translator" | "on_request"
      clinic_language_types:
        | "English"
        | "Arabic"
        | "Spanish"
        | "Russian"
        | "French"
        | "Portuguese"
        | "Hungarian"
        | "Italian"
        | "German"
        | "Polish"
        | "Ukranian"
        | "Dutch"
        | "Romanian"
        | "Hindi"
        | "Mandarin Chinese"
        | "Urdu"
        | "Bengali"
      clinic_pricing_type: "range" | "fixed" | "quote_only"
      clinic_roles:
        | "medical_director"
        | "surgeon"
        | "coordinator"
        | "translator"
        | "nurse"
        | "doctor"
        | "other"
      clinic_service_category:
        | "Medical Tourism"
        | "Cosmetic"
        | "Dental"
        | "Other"
      clinic_service_name: "Hair Transplant" | "Rhinoplasty" | "Other"
      clinic_status: "active" | "inactive" | "under_review"
      computed_by_enum: "extractor" | "human" | "inquiry" | "model"
      desired_density: "maximum" | "high" | "medium" | "low"
      doc_type_enum: "html" | "pdf" | "post" | "comment" | "review"
      forum_source_enum: "hrn" | "reddit" | "realself"
      doctor_involvement_levels: "high" | "medium" | "low"
      donor_area_availability: "good" | "adequate" | "limited"
      donor_area_quality: "excellent" | "good" | "adequate" | "poor"
      hair_loss_pattern: "early" | "moderate" | "advanced" | "extensive"
      instagram_post_type: "Image" | "Video" | "Sidecar"
      mention_topic_enum:
        | "pricing"
        | "results"
        | "staff"
        | "logistics"
        | "complaint"
        | "praise"
        | "bait_and_switch"
        | "coordinator_behavior"
        | "response_time"
        | "package_accuracy"
        | "before_after"
      photo_view: "front" | "left_side" | "right_side" | "top" | "donor_area"
      score_band_enum: "A" | "B" | "C" | "D"
      sentiment_enum: "negative" | "neutral" | "positive"
      social_platform_enum:
        | "instagram"
        | "tiktok"
        | "x"
        | "reddit"
        | "youtube"
        | "facebook"
      source_type_enum:
        | "clinic_website"
        | "registry"
        | "review_platform"
        | "forum"
        | "reddit"
        | "quora"
        | "social_media"
        | "mystery_inquiry"
        | "internal_note"
      treatment_timeline:
        | "1_3_months"
        | "3_6_months"
        | "6_12_months"
        | "12_plus_months"
      value_type_enum: "string" | "number" | "bool" | "json"
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
      age_tier: ["18_24", "25_34", "35_44", "45_54", "55_64", "65_plus"],
      budget_tier: [
        "under_2000",
        "2000_5000",
        "5000_8000",
        "8000_12000",
        "12000_plus",
      ],
      clinic_credential_types: [
        "license",
        "accreditation",
        "membership",
        "registry_id",
        "other",
      ],
      clinic_language_support_types: ["staff", "translator", "on_request"],
      clinic_language_types: [
        "English",
        "Arabic",
        "Spanish",
        "Russian",
        "French",
        "Portuguese",
        "Hungarian",
        "Italian",
        "German",
        "Polish",
        "Ukranian",
        "Dutch",
        "Romanian",
        "Hindi",
        "Mandarin Chinese",
        "Urdu",
        "Bengali",
      ],
      clinic_pricing_type: ["range", "fixed", "quote_only"],
      clinic_roles: [
        "medical_director",
        "surgeon",
        "coordinator",
        "translator",
        "nurse",
        "doctor",
        "other",
      ],
      clinic_service_category: [
        "Medical Tourism",
        "Cosmetic",
        "Dental",
        "Other",
      ],
      clinic_service_name: ["Hair Transplant", "Rhinoplasty", "Other"],
      clinic_status: ["active", "inactive", "under_review"],
      computed_by_enum: ["extractor", "human", "inquiry", "model"],
      desired_density: ["maximum", "high", "medium", "low"],
      doc_type_enum: ["html", "pdf", "post", "comment", "review"],
      forum_source_enum: ["hrn", "reddit", "realself"],
      doctor_involvement_levels: ["high", "medium", "low"],
      donor_area_availability: ["good", "adequate", "limited"],
      donor_area_quality: ["excellent", "good", "adequate", "poor"],
      hair_loss_pattern: ["early", "moderate", "advanced", "extensive"],
      instagram_post_type: ["Image", "Video", "Sidecar"],
      mention_topic_enum: [
        "pricing",
        "results",
        "staff",
        "logistics",
        "complaint",
        "praise",
        "bait_and_switch",
        "coordinator_behavior",
        "response_time",
        "package_accuracy",
        "before_after",
      ],
      photo_view: ["front", "left_side", "right_side", "top", "donor_area"],
      score_band_enum: ["A", "B", "C", "D"],
      sentiment_enum: ["negative", "neutral", "positive"],
      social_platform_enum: [
        "instagram",
        "tiktok",
        "x",
        "reddit",
        "youtube",
        "facebook",
      ],
      source_type_enum: [
        "clinic_website",
        "registry",
        "review_platform",
        "forum",
        "reddit",
        "quora",
        "social_media",
        "mystery_inquiry",
        "internal_note",
      ],
      treatment_timeline: [
        "1_3_months",
        "3_6_months",
        "6_12_months",
        "12_plus_months",
      ],
      value_type_enum: ["string", "number", "bool", "json"],
    },
  },
} as const

