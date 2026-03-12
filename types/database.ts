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
      public_snapshots: {
        Row: {
          id: string;
          kind: "transparency" | "territory";
          title: string | null;
          days: number;
          neighborhood: string | null;
          snapshot_at: string;
          data: Json;
          source_version: string | null;
          created_by: string | null;
          is_public: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          kind: "transparency" | "territory";
          title?: string | null;
          days: number;
          neighborhood?: string | null;
          snapshot_at?: string;
          data: Json;
          source_version?: string | null;
          created_by?: string | null;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          kind?: "transparency" | "territory";
          title?: string | null;
          days?: number;
          neighborhood?: string | null;
          snapshot_at?: string;
          data?: Json;
          source_version?: string | null;
          created_by?: string | null;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      public_snapshot_diffs: {
        Row: {
          id: string;
          kind: "transparency" | "territory";
          from_snapshot_id: string;
          to_snapshot_id: string;
          title: string | null;
          diff_data: Json;
          created_by: string | null;
          is_public: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          kind: "transparency" | "territory";
          from_snapshot_id: string;
          to_snapshot_id: string;
          title?: string | null;
          diff_data: Json;
          created_by?: string | null;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          kind?: "transparency" | "territory";
          from_snapshot_id?: string;
          to_snapshot_id?: string;
          title?: string | null;
          diff_data?: Json;
          created_by?: string | null;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      snapshot_jobs: {
        Row: {
          id: string;
          kind: "transparency" | "territory";
          frequency: "daily" | "weekly";
          days: number;
          neighborhood: string | null;
          title_template: string | null;
          is_enabled: boolean;
          last_run_at: string | null;
          last_snapshot_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          kind: "transparency" | "territory";
          frequency: "daily" | "weekly";
          days: number;
          neighborhood?: string | null;
          title_template?: string | null;
          is_enabled?: boolean;
          last_run_at?: string | null;
          last_snapshot_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          kind?: "transparency" | "territory";
          frequency?: "daily" | "weekly";
          days?: number;
          neighborhood?: string | null;
          title_template?: string | null;
          is_enabled?: boolean;
          last_run_at?: string | null;
          last_snapshot_id?: string | null;
          created_at?: string;
        };
      };
      snapshot_job_runs: {
        Row: {
          id: string;
          job_id: string;
          started_at: string;
          finished_at: string | null;
          status: "running" | "success" | "skipped" | "error";
          message: string | null;
          snapshot_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          job_id: string;
          started_at?: string;
          finished_at?: string | null;
          status?: "running" | "success" | "skipped" | "error";
          message?: string | null;
          snapshot_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          job_id?: string;
          started_at?: string;
          finished_at?: string | null;
          status?: "running" | "success" | "skipped" | "error";
          message?: string | null;
          snapshot_id?: string | null;
          created_at?: string;
        };
      };
      snapshot_diff_runs: {
        Row: {
          id: string;
          source: string;
          snapshot_id: string;
          previous_snapshot_id: string | null;
          diff_id: string | null;
          started_at: string;
          finished_at: string | null;
          status: "running" | "success" | "skipped" | "error";
          message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          source: string;
          snapshot_id: string;
          previous_snapshot_id?: string | null;
          diff_id?: string | null;
          started_at?: string;
          finished_at?: string | null;
          status?: "running" | "success" | "skipped" | "error";
          message?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          source?: string;
          snapshot_id?: string;
          previous_snapshot_id?: string | null;
          diff_id?: string | null;
          started_at?: string;
          finished_at?: string | null;
          status?: "running" | "success" | "skipped" | "error";
          message?: string | null;
          created_at?: string;
        };
      };
      alert_rules: {
        Row: {
          id: string;
          slug: string;
          title: string;
          description: string | null;
          scope: "neighborhood" | "condition" | "global";
          is_enabled: boolean;
          severity: "low" | "medium" | "high" | "critical";
          config: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          description?: string | null;
          scope: "neighborhood" | "condition" | "global";
          is_enabled?: boolean;
          severity?: "low" | "medium" | "high" | "critical";
          config?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          title?: string;
          description?: string | null;
          scope?: "neighborhood" | "condition" | "global";
          is_enabled?: boolean;
          severity?: "low" | "medium" | "high" | "critical";
          config?: Json;
          created_at?: string;
        };
      };
      alert_events: {
        Row: {
          id: string;
          rule_id: string;
          scope: "neighborhood" | "condition" | "global";
          neighborhood: string | null;
          condition: string | null;
          severity: "low" | "medium" | "high" | "critical";
          title: string;
          summary: string | null;
          evidence: Json;
          source_snapshot_id: string | null;
          source_diff_id: string | null;
          status: "open" | "acknowledged" | "dismissed";
          dedupe_key: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          rule_id: string;
          scope: "neighborhood" | "condition" | "global";
          neighborhood?: string | null;
          condition?: string | null;
          severity: "low" | "medium" | "high" | "critical";
          title: string;
          summary?: string | null;
          evidence?: Json;
          source_snapshot_id?: string | null;
          source_diff_id?: string | null;
          status?: "open" | "acknowledged" | "dismissed";
          dedupe_key?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          rule_id?: string;
          scope?: "neighborhood" | "condition" | "global";
          neighborhood?: string | null;
          condition?: string | null;
          severity?: "low" | "medium" | "high" | "critical";
          title?: string;
          summary?: string | null;
          evidence?: Json;
          source_snapshot_id?: string | null;
          source_diff_id?: string | null;
          status?: "open" | "acknowledged" | "dismissed";
          dedupe_key?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      alert_runs: {
        Row: {
          id: string;
          source: "manual" | "job" | "cron";
          started_at: string;
          finished_at: string | null;
          status: "running" | "success" | "skipped" | "error";
          message: string | null;
          alerts_created: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          source: "manual" | "job" | "cron";
          started_at?: string;
          finished_at?: string | null;
          status?: "running" | "success" | "skipped" | "error";
          message?: string | null;
          alerts_created?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          source?: "manual" | "job" | "cron";
          started_at?: string;
          finished_at?: string | null;
          status?: "running" | "success" | "skipped" | "error";
          message?: string | null;
          alerts_created?: number;
          created_at?: string;
        };
      };
      alert_webhook_destinations: {
        Row: {
          id: string;
          slug: string;
          title: string;
          description: string | null;
          is_enabled: boolean;
          webhook_url: string;
          secret_header_name: string | null;
          secret_header_value: string | null;
          event_filter: Json;
          created_at: string;
          updated_at: string;
          signing_mode: string | null;
          signing_secret: string | null;
          signing_header_name: string | null;
          signing_timestamp_header_name: string | null;
          signing_kid: string | null;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          description?: string | null;
          is_enabled?: boolean;
          webhook_url: string;
          secret_header_name?: string | null;
          secret_header_value?: string | null;
          event_filter?: Json;
          created_at?: string;
          updated_at?: string;
          signing_mode?: string | null;
          signing_secret?: string | null;
          signing_header_name?: string | null;
          signing_timestamp_header_name?: string | null;
          signing_kid?: string | null;
        };
        Update: {
          id?: string;
          slug?: string;
          title?: string;
          description?: string | null;
          is_enabled?: boolean;
          webhook_url?: string;
          secret_header_name?: string | null;
          secret_header_value?: string | null;
          event_filter?: Json;
          created_at?: string;
          updated_at?: string;
          signing_mode?: string | null;
          signing_secret?: string | null;
          signing_header_name?: string | null;
          signing_timestamp_header_name?: string | null;
          signing_kid?: string | null;
        };
      };
      alert_delivery_runs: {
        Row: {
          id: string;
          source: string;
          started_at: string;
          finished_at: string | null;
          status: string;
          message: string | null;
          deliveries_attempted: number;
          deliveries_succeeded: number;
          deliveries_failed: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          source: string;
          started_at?: string;
          finished_at?: string | null;
          status?: string;
          message?: string | null;
          deliveries_attempted?: number;
          deliveries_succeeded?: number;
          deliveries_failed?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          source?: string;
          started_at?: string;
          finished_at?: string | null;
          status?: string;
          message?: string | null;
          deliveries_attempted?: number;
          deliveries_succeeded?: number;
          deliveries_failed?: number;
          created_at?: string;
        };
      };
      alert_delivery_policy: {
        Row: {
          id: string;
          slug: string;
          max_attempts: number;
          backoff_seconds: number[];
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          max_attempts?: number;
          backoff_seconds?: number[];
          created_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          max_attempts?: number;
          backoff_seconds?: number[];
          created_at?: string;
        };
      };
      alert_deliveries: {
        Row: {
          id: string;
          alert_id: string;
          destination_id: string;
          run_id: string | null;
          status: string;
          response_status: number | null;
          response_excerpt: string | null;
          dedupe_key: string | null;
          attempted_at: string;
          created_at: string;
          attempt_number: number;
          next_retry_at: string | null;
          final_status: string | null;
          last_error_code: string | null;
          last_error_excerpt: string | null;
        };
        Insert: {
          id?: string;
          alert_id: string;
          destination_id: string;
          run_id?: string | null;
          status?: string;
          response_status?: number | null;
          response_excerpt?: string | null;
          dedupe_key?: string | null;
          attempted_at?: string;
          created_at?: string;
          attempt_number?: number;
          next_retry_at?: string | null;
          final_status?: string | null;
          last_error_code?: string | null;
          last_error_excerpt?: string | null;
        };
        Update: {
          id?: string;
          alert_id?: string;
          destination_id?: string;
          run_id?: string | null;
          status?: string;
          response_status?: number | null;
          response_excerpt?: string | null;
          dedupe_key?: string | null;
          attempted_at?: string;
          created_at?: string;
          attempt_number?: number;
          next_retry_at?: string | null;
          final_status?: string | null;
          last_error_code?: string | null;
          last_error_excerpt?: string | null;
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
      list_reports_for_moderation: {
        Args: {
          in_status?: string | null;
          in_limit?: number;
        };
        Returns: Array<{
          id: string;
          created_at: string;
          updated_at: string;
          created_by: string;
          status: string;
          condition: string;
          neighborhood: string | null;
          note: string | null;
          lat: number;
          lng: number;
          needs_review: boolean;
          accuracy_m: number | null;
          verification_count: number;
          is_verified: boolean;
        }>;
      };
      moderate_sidewalk_report: {
        Args: {
          in_report_id: string;
          in_action: string;
          in_reason?: string | null;
        };
        Returns: {
          ok: boolean;
          message: string;
          new_status?: string;
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
      get_neighborhood_priority_breakdown: {
        Args: {
          in_days?: number;
        };
        Returns: Array<{
          neighborhood: string;
          total_published: number;
          total_verified: number;
          total_blocked: number;
          total_bad: number;
          total_good: number;
          with_photo: number;
          priority_score: number;
        }>;
      };
      get_neighborhood_recent_alerts: {
        Args: {
          in_limit?: number;
          in_days?: number;
        };
        Returns: Array<{
          id: string;
          created_at: string;
          neighborhood: string;
          condition: string;
          verification_count: number;
          is_verified: boolean;
          has_photo: boolean;
        }>;
      };
      get_priority_map_points: {
        Args: {
          in_days?: number;
          in_condition?: string | null;
        };
        Returns: Array<{
          id: string;
          lat: number;
          lng: number;
          neighborhood: string;
          condition: string;
          verification_count: number;
          is_verified: boolean;
        }>;
      };
      get_timeline_series: {
        Args: {
          in_days?: number;
          in_bucket?: string;
          in_neighborhood?: string | null;
        };
        Returns: Array<{
          bucket_start: string;
          published_count: number;
          verified_count: number;
          blocked_count: number;
          bad_count: number;
          good_count: number;
          with_photo_count: number;
        }>;
      };
      get_timeline_condition_series: {
        Args: {
          in_days?: number;
          in_bucket?: string;
          in_neighborhood?: string | null;
        };
        Returns: Array<{
          bucket_start: string;
          condition: string;
          count: number;
          verified_count: number;
        }>;
      };
      get_temporal_hotspots: {
        Args: {
          in_days?: number;
          in_limit?: number;
        };
        Returns: Array<{
          neighborhood: string;
          condition: string;
          count: number;
          verified_count: number;
          blocked_count: number;
          latest_bucket: string;
          hotspot_score: number;
        }>;
      };
      get_map_hotspots: {
        Args: {
          in_days?: number;
          in_condition?: string | null;
          in_verified_only?: boolean;
        };
        Returns: Array<{
          id: string;
          lat: number;
          lng: number;
          neighborhood: string | null;
          condition: string;
          created_at: string;
          verification_count: number;
          is_verified: boolean;
          hotspot_rank: number;
        }>;
      };
      list_snapshot_jobs: {
        Args: Record<string, never>;
        Returns: Array<{
          id: string;
          kind: "transparency" | "territory";
          frequency: "daily" | "weekly";
          days: number;
          neighborhood: string | null;
          is_enabled: boolean;
          last_run_at: string | null;
          last_snapshot_id: string | null;
        }>;
      };
      list_snapshot_job_runs: {
        Args: {
          in_limit?: number;
        };
        Returns: Array<{
          id: string;
          job_id: string;
          started_at: string;
          finished_at: string | null;
          status: "running" | "success" | "skipped" | "error";
          message: string | null;
          snapshot_id: string | null;
        }>;
      };
      run_snapshot_job: {
        Args: {
          in_job_id: string;
        };
        Returns: Array<{
          ok: boolean;
          message: string;
          status: "success" | "skipped" | "error";
          snapshot_id: string | null;
        }>;
      };
      find_previous_compatible_snapshot: {
        Args: {
          in_snapshot_id: string;
        };
        Returns: Array<{
          snapshot_id: string;
          kind: string;
          days: number;
          neighborhood: string | null;
          snapshot_at: string;
        }>;
      };
      create_auto_diff_for_snapshot: {
        Args: {
          in_snapshot_id: string;
          in_source?: string;
        };
        Returns: Array<{
          ok: boolean;
          message: string;
          status: string;
          previous_snapshot_id: string | null;
          diff_id: string | null;
        }>;
      };
      list_snapshot_diff_runs: {
        Args: {
          in_limit?: number;
        };
        Returns: Array<{
          id: string;
          source: string;
          snapshot_id: string;
          previous_snapshot_id: string | null;
          diff_id: string | null;
          started_at: string;
          finished_at: string | null;
          status: string;
          message: string | null;
        }>;
      };
      evaluate_alert_rules: {
        Args: {
          in_days?: number;
          in_baseline_days?: number;
          in_source?: string;
        };
        Returns: Array<{
          ok: boolean;
          message: string;
          alerts_created: number;
          run_id: string | null;
        }>;
      };
      list_alert_events: {
        Args: {
          in_status?: string | null;
          in_limit?: number;
        };
        Returns: Array<{
          id: string;
          severity: string;
          scope: string;
          neighborhood: string | null;
          condition: string | null;
          title: string;
          summary: string | null;
          status: string;
          created_at: string;
          source_snapshot_id: string | null;
          source_diff_id: string | null;
        }>;
      };
      update_alert_event_status: {
        Args: {
          in_alert_id: string;
          in_status: string;
        };
        Returns: Array<{
          ok: boolean;
          message: string;
          status: string;
        }>;
      };
      list_alert_runs: {
        Args: {
          in_limit?: number;
        };
        Returns: Array<{
          id: string;
          source: string;
          started_at: string;
          finished_at: string | null;
          status: string;
          message: string | null;
          alerts_created: number;
        }>;
      };
      list_alert_webhook_destinations: {
        Args: Record<PropertyKey, never>;
        Returns: Array<{
          id: string;
          slug: string;
          title: string;
          description: string | null;
          is_enabled: boolean;
          webhook_url: string;
          event_filter: Json;
          signing_mode: string | null;
          signing_header_name: string | null;
          signing_timestamp_header_name: string | null;
          signing_kid: string | null;
          created_at: string;
          updated_at: string;
        }>;
      };
      list_open_alert_events_for_delivery: {
        Args: {
          in_limit?: number;
        };
        Returns: Array<{
          id: string;
          severity: string;
          scope: string;
          neighborhood: string | null;
          condition: string | null;
          title: string;
          summary: string | null;
          status: string;
          created_at: string;
          source_snapshot_id: string | null;
          source_diff_id: string | null;
        }>;
      };
      list_alert_deliveries: {
        Args: {
          in_limit?: number;
        };
        Returns: Array<{
          id: string;
          alert_id: string;
          destination_id: string;
          run_id: string | null;
          status: string;
          response_status: number | null;
          response_excerpt: string | null;
          attempted_at: string;
          alert_title: string;
          destination_title: string;
        }>;
      };
      list_alert_delivery_runs: {
        Args: {
          in_limit?: number;
        };
        Returns: Array<{
          id: string;
          source: string;
          started_at: string;
          finished_at: string | null;
          status: string;
          message: string | null;
          deliveries_attempted: number;
          deliveries_succeeded: number;
          deliveries_failed: number;
        }>;
      };
      mark_alert_delivery_retry_result: {
        Args: {
          in_delivery_id: string;
          in_status: string;
          in_response_status?: number | null;
          in_response_excerpt?: string | null;
          in_error_code?: string | null;
        };
        Returns: Array<{
          ok: boolean;
          message: string;
          final_status: string;
        }>;
      };
      list_retryable_alert_deliveries: {
        Args: {
          in_limit?: number;
        };
        Returns: Array<{
          id: string;
          alert_id: string;
          destination_id: string;
          status: string;
          response_status: number;
          attempted_at: string;
          attempt_number: number;
          next_retry_at: string;
          final_status: string;
          alert_title: string;
          destination_title: string;
          webhook_url: string;
        }>;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
