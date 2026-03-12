export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          role: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          role?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          role?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      sidewalk_reports: {
        Row: {
          id: string;
          created_by: string;
          created_at: string;
          updated_at: string;
          status: string;
          condition: string;
          lat: number;
          lng: number;
          neighborhood: string | null;
          note: string | null;
          photo_public_path: string | null;
          photo_private_path: string | null;
          needs_review: boolean;
          accuracy_m: number | null;
        };
        Insert: {
          id?: string;
          created_by: string;
          created_at?: string;
          updated_at?: string;
          status?: string;
          condition: string;
          lat: number;
          lng: number;
          neighborhood?: string | null;
          note?: string | null;
          photo_public_path?: string | null;
          photo_private_path?: string | null;
          needs_review?: boolean;
          accuracy_m?: number | null;
        };
        Update: {
          id?: string;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
          status?: string;
          condition?: string;
          lat?: number;
          lng?: number;
          neighborhood?: string | null;
          note?: string | null;
          photo_public_path?: string | null;
          photo_private_path?: string | null;
          needs_review?: boolean;
          accuracy_m?: number | null;
        };
      };
      sidewalk_tags: {
        Row: {
          slug: string;
          label: string;
        };
        Insert: {
          slug: string;
          label: string;
        };
        Update: {
          slug?: string;
          label?: string;
        };
      };
      sidewalk_report_tags: {
        Row: {
          report_id: string;
          tag_slug: string;
        };
        Insert: {
          report_id: string;
          tag_slug: string;
        };
        Update: {
          report_id?: string;
          tag_slug?: string;
        };
      };
      sidewalk_verifications: {
        Row: {
          report_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          report_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          report_id?: string;
          user_id?: string;
          created_at?: string;
        };
      };
      moderation_events: {
        Row: {
          id: string;
          report_id: string;
          moderator_id: string | null;
          action: string;
          reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          report_id: string;
          moderator_id?: string | null;
          action: string;
          reason?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          report_id?: string;
          moderator_id?: string | null;
          action?: string;
          reason?: string | null;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: {
      list_published_reports: {
        Args: {
          in_condition?: string | null;
          in_neighborhood?: string | null;
          in_verified_only?: boolean;
        };
        Returns: Array<{
          id: string;
          created_at: string;
          condition: string;
          lat: number;
          lng: number;
          neighborhood: string | null;
          note: string | null;
          verification_count: number;
          is_verified: boolean;
        }>;
      };
      get_published_report_by_id: {
        Args: {
          in_id: string;
        };
        Returns: Array<{
          id: string;
          created_at: string;
          condition: string;
          lat: number;
          lng: number;
          neighborhood: string | null;
          note: string | null;
          verification_count: number;
          is_verified: boolean;
        }>;
      };
      confirm_sidewalk_report: {
        Args: {
          in_report_id: string;
        };
        Returns: {
          ok: boolean;
          message: string;
          verification_count?: number;
          is_verified?: boolean;
        };
      };
      nearby_sidewalk_reports: {
        Args: {
          in_lat: number;
          in_lng: number;
          in_meters?: number;
        };
        Returns: Array<{
          id: string;
          condition: string;
          neighborhood: string | null;
          created_at: string;
          distance_m: number;
        }>;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
