export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
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
          {
            foreignKeyName: "clinic_credentials_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics_with_scores"
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
          {
            foreignKeyName: "clinic_facts_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics_with_scores"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_forum_profiles: {
        Row: {
          captured_at: string
          clinic_id: string
          common_concerns: string[] | null
          confidence_score: number | null
          forum_source: Database["public"]["Enums"]["forum_source_enum"]
          id: string
          is_stale: boolean
          last_thread_at: string | null
          longterm_thread_count: number
          notable_threads: Json | null
          photo_thread_count: number
          repair_mention_count: number
          sentiment_distribution: Json | null
          sentiment_score: number | null
          summary: string | null
          thread_count: number
          unique_authors_count: number | null
          updated_at: string
        }
        Insert: {
          captured_at?: string
          clinic_id: string
          common_concerns?: string[] | null
          confidence_score?: number | null
          forum_source: Database["public"]["Enums"]["forum_source_enum"]
          id?: string
          is_stale?: boolean
          last_thread_at?: string | null
          longterm_thread_count?: number
          notable_threads?: Json | null
          photo_thread_count?: number
          repair_mention_count?: number
          sentiment_distribution?: Json | null
          sentiment_score?: number | null
          summary?: string | null
          thread_count?: number
          unique_authors_count?: number | null
          updated_at?: string
        }
        Update: {
          captured_at?: string
          clinic_id?: string
          common_concerns?: string[] | null
          confidence_score?: number | null
          forum_source?: Database["public"]["Enums"]["forum_source_enum"]
          id?: string
          is_stale?: boolean
          last_thread_at?: string | null
          longterm_thread_count?: number
          notable_threads?: Json | null
          photo_thread_count?: number
          repair_mention_count?: number
          sentiment_distribution?: Json | null
          sentiment_score?: number | null
          summary?: string | null
          thread_count?: number
          unique_authors_count?: number | null
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
          {
            foreignKeyName: "clinic_forum_profiles_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics_with_scores"
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
          {
            foreignKeyName: "clinic_google_places_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics_with_scores"
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
            foreignKeyName: "clinic_instagram_posts_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics_with_scores"
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
          {
            foreignKeyName: "clinic_languages_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics_with_scores"
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
          {
            foreignKeyName: "clinic_locations_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics_with_scores"
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
            foreignKeyName: "clinic_media_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics_with_scores"
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
            foreignKeyName: "clinic_mentions_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics_with_scores"
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
          {
            foreignKeyName: "clinic_packages_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics_with_scores"
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
            foreignKeyName: "clinic_pricing_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics_with_scores"
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
      clinic_reddit_posts: {
        Row: {
          author_username: string | null
          body: string | null
          captured_at: string
          clinic_id: string
          comment_count: number | null
          had_clinical_procedures: boolean | null
          id: string
          is_firsthand: boolean | null
          medical_summary: string | null
          post_type: Database["public"]["Enums"]["reddit_post_type"]
          posted_at: string | null
          reddit_post_id: string
          score: number | null
          seeking_medical_help: boolean | null
          source_id: string | null
          subreddit: string | null
          title: string | null
          url: string
        }
        Insert: {
          author_username?: string | null
          body?: string | null
          captured_at?: string
          clinic_id: string
          comment_count?: number | null
          had_clinical_procedures?: boolean | null
          id?: string
          is_firsthand?: boolean | null
          medical_summary?: string | null
          post_type: Database["public"]["Enums"]["reddit_post_type"]
          posted_at?: string | null
          reddit_post_id: string
          score?: number | null
          seeking_medical_help?: boolean | null
          source_id?: string | null
          subreddit?: string | null
          title?: string | null
          url: string
        }
        Update: {
          author_username?: string | null
          body?: string | null
          captured_at?: string
          clinic_id?: string
          comment_count?: number | null
          had_clinical_procedures?: boolean | null
          id?: string
          is_firsthand?: boolean | null
          medical_summary?: string | null
          post_type?: Database["public"]["Enums"]["reddit_post_type"]
          posted_at?: string | null
          reddit_post_id?: string
          score?: number | null
          seeking_medical_help?: boolean | null
          source_id?: string | null
          subreddit?: string | null
          title?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinic_reddit_posts_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinic_reddit_posts_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics_with_scores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinic_reddit_posts_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_reddit_profiles: {
        Row: {
          captured_at: string
          caution_flags: Json | null
          clinic_id: string
          confidence_score: number | null
          cons: string[] | null
          id: string
          last_mentioned_at: string | null
          mention_count: number
          notable_mentions: Json | null
          pros: string[] | null
          sentiment_score: number | null
          summary: string | null
          themes: Json | null
          thread_count: number
          unique_authors_count: number | null
          updated_at: string
        }
        Insert: {
          captured_at?: string
          caution_flags?: Json | null
          clinic_id: string
          confidence_score?: number | null
          cons?: string[] | null
          id?: string
          last_mentioned_at?: string | null
          mention_count?: number
          notable_mentions?: Json | null
          pros?: string[] | null
          sentiment_score?: number | null
          summary?: string | null
          themes?: Json | null
          thread_count?: number
          unique_authors_count?: number | null
          updated_at?: string
        }
        Update: {
          captured_at?: string
          caution_flags?: Json | null
          clinic_id?: string
          confidence_score?: number | null
          cons?: string[] | null
          id?: string
          last_mentioned_at?: string | null
          mention_count?: number
          notable_mentions?: Json | null
          pros?: string[] | null
          sentiment_score?: number | null
          summary?: string | null
          themes?: Json | null
          thread_count?: number
          unique_authors_count?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinic_reddit_profiles_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: true
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinic_reddit_profiles_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: true
            referencedRelation: "clinics_with_scores"
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
            foreignKeyName: "clinic_reviews_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics_with_scores"
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
          {
            foreignKeyName: "clinic_score_components_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics_with_scores"
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
          {
            foreignKeyName: "clinic_scores_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: true
            referencedRelation: "clinics_with_scores"
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
          {
            foreignKeyName: "clinic_services_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics_with_scores"
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
          {
            foreignKeyName: "clinic_social_media_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics_with_scores"
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
          {
            foreignKeyName: "clinic_team_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics_with_scores"
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
      forum_thread_index: {
        Row: {
          author_username: string | null
          clinic_attribution_method: string | null
          clinic_id: string | null
          first_scraped_at: string
          forum_source: Database["public"]["Enums"]["forum_source_enum"]
          id: string
          last_scraped_at: string
          post_date: string | null
          reply_count: number | null
          source_id: string | null
          thread_url: string
          title: string | null
        }
        Insert: {
          author_username?: string | null
          clinic_attribution_method?: string | null
          clinic_id?: string | null
          first_scraped_at?: string
          forum_source: Database["public"]["Enums"]["forum_source_enum"]
          id?: string
          last_scraped_at?: string
          post_date?: string | null
          reply_count?: number | null
          source_id?: string | null
          thread_url: string
          title?: string | null
        }
        Update: {
          author_username?: string | null
          clinic_attribution_method?: string | null
          clinic_id?: string | null
          first_scraped_at?: string
          forum_source?: Database["public"]["Enums"]["forum_source_enum"]
          id?: string
          last_scraped_at?: string
          post_date?: string | null
          reply_count?: number | null
          source_id?: string | null
          thread_url?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "forum_thread_index_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_thread_index_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics_with_scores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_thread_index_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_thread_llm_analysis: {
        Row: {
          attributed_clinic_id: string | null
          attributed_clinic_name: string | null
          attributed_doctor_name: string | null
          evidence_snippets: Json | null
          id: string
          is_current: boolean
          is_repair_case: boolean | null
          issue_keywords: string[] | null
          main_topics: string[] | null
          model_name: string
          prompt_version: string
          run_timestamp: string
          satisfaction_label: string | null
          secondary_clinic_mentions: Json | null
          sentiment_label: string | null
          sentiment_score: number | null
          summary_short: string | null
          thread_id: string
        }
        Insert: {
          attributed_clinic_id?: string | null
          attributed_clinic_name?: string | null
          attributed_doctor_name?: string | null
          evidence_snippets?: Json | null
          id?: string
          is_current?: boolean
          is_repair_case?: boolean | null
          issue_keywords?: string[] | null
          main_topics?: string[] | null
          model_name: string
          prompt_version: string
          run_timestamp?: string
          satisfaction_label?: string | null
          secondary_clinic_mentions?: Json | null
          sentiment_label?: string | null
          sentiment_score?: number | null
          summary_short?: string | null
          thread_id: string
        }
        Update: {
          attributed_clinic_id?: string | null
          attributed_clinic_name?: string | null
          attributed_doctor_name?: string | null
          evidence_snippets?: Json | null
          id?: string
          is_current?: boolean
          is_repair_case?: boolean | null
          issue_keywords?: string[] | null
          main_topics?: string[] | null
          model_name?: string
          prompt_version?: string
          run_timestamp?: string
          satisfaction_label?: string | null
          secondary_clinic_mentions?: Json | null
          sentiment_label?: string | null
          sentiment_score?: number | null
          summary_short?: string | null
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_thread_llm_analysis_attributed_clinic_id_fkey"
            columns: ["attributed_clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_thread_llm_analysis_attributed_clinic_id_fkey"
            columns: ["attributed_clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics_with_scores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_thread_llm_analysis_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "forum_thread_index"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_thread_signals: {
        Row: {
          created_at: string
          evidence_snippet: string | null
          extraction_method: string
          extraction_version: string | null
          id: string
          signal_name: string
          signal_value: Json
          thread_id: string
        }
        Insert: {
          created_at?: string
          evidence_snippet?: string | null
          extraction_method: string
          extraction_version?: string | null
          id?: string
          signal_name: string
          signal_value: Json
          thread_id: string
        }
        Update: {
          created_at?: string
          evidence_snippet?: string | null
          extraction_method?: string
          extraction_version?: string | null
          id?: string
          signal_name?: string
          signal_value?: Json
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_thread_signals_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "forum_thread_index"
            referencedColumns: ["id"]
          },
        ]
      }
      hrn_thread_content: {
        Row: {
          forum_section_id: string | null
          forum_section_name: string | null
          has_photos: boolean | null
          image_urls: string[] | null
          last_author_post_date: string | null
          last_author_post_page: number | null
          last_author_post_text: string | null
          op_html: string | null
          op_text: string | null
          scrape_strategy: string | null
          sitemap_lastmod: string | null
          thread_id: string
          total_pages: number | null
          view_count: number | null
        }
        Insert: {
          forum_section_id?: string | null
          forum_section_name?: string | null
          has_photos?: boolean | null
          image_urls?: string[] | null
          last_author_post_date?: string | null
          last_author_post_page?: number | null
          last_author_post_text?: string | null
          op_html?: string | null
          op_text?: string | null
          scrape_strategy?: string | null
          sitemap_lastmod?: string | null
          thread_id: string
          total_pages?: number | null
          view_count?: number | null
        }
        Update: {
          forum_section_id?: string | null
          forum_section_name?: string | null
          has_photos?: boolean | null
          image_urls?: string[] | null
          last_author_post_date?: string | null
          last_author_post_page?: number | null
          last_author_post_text?: string | null
          op_html?: string | null
          op_text?: string | null
          scrape_strategy?: string | null
          sitemap_lastmod?: string | null
          thread_id?: string
          total_pages?: number | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "hrn_thread_content_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: true
            referencedRelation: "forum_thread_index"
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
    }
    Views: {
      clinics_with_scores: {
        Row: {
          created_at: string | null
          description: string | null
          display_name: string | null
          email_contact: string | null
          google_place_id: string | null
          google_rating: number | null
          google_review_count: number | null
          id: string | null
          legal_name: string | null
          overall_score: number | null
          phone_contact: string | null
          primary_city: string | null
          primary_country: string | null
          procedures_performed: number | null
          score_band: Database["public"]["Enums"]["score_band_enum"] | null
          score_computed_at: string | null
          short_description: string | null
          status: Database["public"]["Enums"]["clinic_status"] | null
          thumbnail_url: string | null
          updated_at: string | null
          website_url: string | null
          whatsapp_contact: string | null
          years_in_operation: number | null
        }
        Relationships: []
      }
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
      doc_type_enum: "html" | "pdf" | "post" | "comment" | "review"
      doctor_involvement_levels: "high" | "medium" | "low"
      forum_source_enum: "hrn" | "reddit" | "realself"
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
      reddit_post_type: "post" | "comment"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
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
      doc_type_enum: ["html", "pdf", "post", "comment", "review"],
      doctor_involvement_levels: ["high", "medium", "low"],
      forum_source_enum: ["hrn", "reddit", "realself"],
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
      reddit_post_type: ["post", "comment"],
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
      value_type_enum: ["string", "number", "bool", "json"],
    },
  },
} as const

