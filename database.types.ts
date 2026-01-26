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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: Database["public"]["Enums"]["audit_action"]
          created_at: string
          ip_address: string | null
          log_id: string
          new_values: Json | null
          old_values: Json | null
          record_id: string
          table_name: string
          user_agent: string | null
          user_id: string | null
          workspace_id: string
        }
        Insert: {
          action: Database["public"]["Enums"]["audit_action"]
          created_at?: string
          ip_address?: string | null
          log_id?: string
          new_values?: Json | null
          old_values?: Json | null
          record_id: string
          table_name: string
          user_agent?: string | null
          user_id?: string | null
          workspace_id: string
        }
        Update: {
          action?: Database["public"]["Enums"]["audit_action"]
          created_at?: string
          ip_address?: string | null
          log_id?: string
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_workspace_id_workspace_workspace_id_fk"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspace"
            referencedColumns: ["workspace_id"]
          },
        ]
      }
      delivery_events_email: {
        Row: {
          edition_id: string
          event_at: string
          event_id: string
          event_type: Database["public"]["Enums"]["delivery_event_type_email"]
          meta_json: Json
          provider_event_id: string | null
          recipient_email: string | null
          workspace_id: string
        }
        Insert: {
          edition_id: string
          event_at: string
          event_id?: string
          event_type: Database["public"]["Enums"]["delivery_event_type_email"]
          meta_json?: Json
          provider_event_id?: string | null
          recipient_email?: string | null
          workspace_id: string
        }
        Update: {
          edition_id?: string
          event_at?: string
          event_id?: string
          event_type?: Database["public"]["Enums"]["delivery_event_type_email"]
          meta_json?: Json
          provider_event_id?: string | null
          recipient_email?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_events_email_edition_id_newsletter_editions_edition_id"
            columns: ["edition_id"]
            isOneToOne: false
            referencedRelation: "newsletter_editions"
            referencedColumns: ["edition_id"]
          },
          {
            foreignKeyName: "delivery_events_email_workspace_id_workspace_workspace_id_fk"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspace"
            referencedColumns: ["workspace_id"]
          },
        ]
      }
      external_events: {
        Row: {
          external_event_id: string
          payload: Json
          processed_at: string | null
          received_at: string
          source: string
          status: string
          type: string
        }
        Insert: {
          external_event_id: string
          payload: Json
          processed_at?: string | null
          received_at?: string
          source: string
          status?: string
          type: string
        }
        Update: {
          external_event_id?: string
          payload?: Json
          processed_at?: string | null
          received_at?: string
          source?: string
          status?: string
          type?: string
        }
        Relationships: []
      }
      github_installation_requests: {
        Row: {
          account_login: string | null
          approved_at: string | null
          created_at: string
          expires_at: string
          installation_id: number | null
          request_id: string
          state_data: string
          status: Database["public"]["Enums"]["installation_request_status"]
          user_id: string
          workspace_id: string
        }
        Insert: {
          account_login?: string | null
          approved_at?: string | null
          created_at?: string
          expires_at: string
          installation_id?: number | null
          request_id?: string
          state_data: string
          status?: Database["public"]["Enums"]["installation_request_status"]
          user_id: string
          workspace_id: string
        }
        Update: {
          account_login?: string | null
          approved_at?: string | null
          created_at?: string
          expires_at?: string
          installation_id?: number | null
          request_id?: string
          state_data?: string
          status?: Database["public"]["Enums"]["installation_request_status"]
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "github_installation_requests_workspace_id_workspace_workspace_i"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspace"
            referencedColumns: ["workspace_id"]
          },
        ]
      }
      highlights: {
        Row: {
          archived_at: string | null
          created_at: string
          dedup_key: string | null
          highlight_id: string
          is_archived: boolean
          meta_json: Json
          period: Database["public"]["Enums"]["period"]
          period_key: string
          run_id: string
          source: string
          tags: string[] | null
          title: string
          url: string | null
          weight: number
          workspace_id: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          dedup_key?: string | null
          highlight_id?: string
          is_archived?: boolean
          meta_json?: Json
          period?: Database["public"]["Enums"]["period"]
          period_key?: string
          run_id: string
          source: string
          tags?: string[] | null
          title: string
          url?: string | null
          weight?: number
          workspace_id: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          dedup_key?: string | null
          highlight_id?: string
          is_archived?: boolean
          meta_json?: Json
          period?: Database["public"]["Enums"]["period"]
          period_key?: string
          run_id?: string
          source?: string
          tags?: string[] | null
          title?: string
          url?: string | null
          weight?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "highlights_run_id_newsletter_runs_run_id_fk"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "newsletter_runs"
            referencedColumns: ["run_id"]
          },
          {
            foreignKeyName: "highlights_workspace_id_workspace_workspace_id_fk"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspace"
            referencedColumns: ["workspace_id"]
          },
        ]
      }
      integration_statuses: {
        Row: {
          connection_status: Database["public"]["Enums"]["connection_status"]
          expires_at: string | null
          integration_id: string
          last_checked_at: string | null
          last_ok_at: string | null
          permissions_json: Json
          provider_error_code: string | null
          provider_error_message: string | null
          resource_cache_json: Json
          workspace_id: string
        }
        Insert: {
          connection_status?: Database["public"]["Enums"]["connection_status"]
          expires_at?: string | null
          integration_id: string
          last_checked_at?: string | null
          last_ok_at?: string | null
          permissions_json?: Json
          provider_error_code?: string | null
          provider_error_message?: string | null
          resource_cache_json?: Json
          workspace_id: string
        }
        Update: {
          connection_status?: Database["public"]["Enums"]["connection_status"]
          expires_at?: string | null
          integration_id?: string
          last_checked_at?: string | null
          last_ok_at?: string | null
          permissions_json?: Json
          provider_error_code?: string | null
          provider_error_message?: string | null
          resource_cache_json?: Json
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_statuses_integration_id_integrations_integration_id"
            columns: ["integration_id"]
            isOneToOne: true
            referencedRelation: "integrations"
            referencedColumns: ["integration_id"]
          },
          {
            foreignKeyName: "integration_statuses_integration_id_integrations_integration_id"
            columns: ["integration_id"]
            isOneToOne: true
            referencedRelation: "v_integration_info"
            referencedColumns: ["integration_id"]
          },
          {
            foreignKeyName: "integration_statuses_integration_id_integrations_integration_id"
            columns: ["integration_id"]
            isOneToOne: true
            referencedRelation: "v_integration_is_connected"
            referencedColumns: ["integration_id"]
          },
          {
            foreignKeyName: "integration_statuses_workspace_id_workspace_workspace_id_fk"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspace"
            referencedColumns: ["workspace_id"]
          },
        ]
      }
      integrations: {
        Row: {
          api_key_ref: string | null
          config_json: Json
          created_at: string
          created_by: string | null
          credential_ref: string
          integration_id: string
          is_active: boolean
          name: string
          type: Database["public"]["Enums"]["integration_type"]
          updated_at: string
          webhook_url: string | null
          workspace_id: string
        }
        Insert: {
          api_key_ref?: string | null
          config_json?: Json
          created_at?: string
          created_by?: string | null
          credential_ref: string
          integration_id?: string
          is_active?: boolean
          name: string
          type: Database["public"]["Enums"]["integration_type"]
          updated_at?: string
          webhook_url?: string | null
          workspace_id: string
        }
        Update: {
          api_key_ref?: string | null
          config_json?: Json
          created_at?: string
          created_by?: string | null
          credential_ref?: string
          integration_id?: string
          is_active?: boolean
          name?: string
          type?: Database["public"]["Enums"]["integration_type"]
          updated_at?: string
          webhook_url?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "integrations_workspace_id_workspace_workspace_id_fk"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspace"
            referencedColumns: ["workspace_id"]
          },
        ]
      }
      job_queue: {
        Row: {
          attempts: number
          available_at: string
          created_at: string
          dedupe_key: string
          error: string | null
          finished_at: string | null
          id: string
          job_type: string
          locked_at: string | null
          locked_by: string | null
          max_attempts: number
          payload: Json
          priority: number
          started_at: string | null
          status: Database["public"]["Enums"]["job_status"]
          target_id: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          attempts?: number
          available_at?: string
          created_at?: string
          dedupe_key: string
          error?: string | null
          finished_at?: string | null
          id?: string
          job_type: string
          locked_at?: string | null
          locked_by?: string | null
          max_attempts?: number
          payload?: Json
          priority?: number
          started_at?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          target_id?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          attempts?: number
          available_at?: string
          created_at?: string
          dedupe_key?: string
          error?: string | null
          finished_at?: string | null
          id?: string
          job_type?: string
          locked_at?: string | null
          locked_by?: string | null
          max_attempts?: number
          payload?: Json
          priority?: number
          started_at?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          target_id?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_queue_target_id_targets_target_id_fk"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "targets"
            referencedColumns: ["target_id"]
          },
          {
            foreignKeyName: "job_queue_workspace_id_workspace_workspace_id_fk"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspace"
            referencedColumns: ["workspace_id"]
          },
        ]
      }
      mail_list: {
        Row: {
          archived_at: string | null
          created_at: string
          description: string | null
          is_archived: boolean
          mailing_list_id: string
          name: string
          workspace_id: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          description?: string | null
          is_archived?: boolean
          mailing_list_id?: string
          name: string
          workspace_id: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          description?: string | null
          is_archived?: boolean
          mailing_list_id?: string
          name?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mail_list_workspace_id_workspace_workspace_id_fk"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspace"
            referencedColumns: ["workspace_id"]
          },
        ]
      }
      mail_list_members: {
        Row: {
          created_at: string
          display_name: string | null
          email: string
          mailing_list_id: string
          meta_json: Json
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email: string
          mailing_list_id: string
          meta_json?: Json
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string
          mailing_list_id?: string
          meta_json?: Json
        }
        Relationships: [
          {
            foreignKeyName: "mail_list_members_mailing_list_id_mail_list_mailing_list_id_fk"
            columns: ["mailing_list_id"]
            isOneToOne: false
            referencedRelation: "mail_list"
            referencedColumns: ["mailing_list_id"]
          },
        ]
      }
      newsletter_editions: {
        Row: {
          archive_url: string | null
          archived_at: string | null
          edition_id: string
          failure_reason: string | null
          html_body: string
          is_archived: boolean
          period: Database["public"]["Enums"]["period"]
          period_key: string
          provider_message_id: string | null
          run_id: string | null
          sent_at: string | null
          stats_json: Json
          status: Database["public"]["Enums"]["mail_status"]
          subject: string | null
          target_id: string
          text_body: string | null
          workspace_id: string
        }
        Insert: {
          archive_url?: string | null
          archived_at?: string | null
          edition_id?: string
          failure_reason?: string | null
          html_body: string
          is_archived?: boolean
          period?: Database["public"]["Enums"]["period"]
          period_key?: string
          provider_message_id?: string | null
          run_id?: string | null
          sent_at?: string | null
          stats_json?: Json
          status?: Database["public"]["Enums"]["mail_status"]
          subject?: string | null
          target_id: string
          text_body?: string | null
          workspace_id: string
        }
        Update: {
          archive_url?: string | null
          archived_at?: string | null
          edition_id?: string
          failure_reason?: string | null
          html_body?: string
          is_archived?: boolean
          period?: Database["public"]["Enums"]["period"]
          period_key?: string
          provider_message_id?: string | null
          run_id?: string | null
          sent_at?: string | null
          stats_json?: Json
          status?: Database["public"]["Enums"]["mail_status"]
          subject?: string | null
          target_id?: string
          text_body?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "newsletter_editions_run_id_newsletter_runs_run_id_fk"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "newsletter_runs"
            referencedColumns: ["run_id"]
          },
          {
            foreignKeyName: "newsletter_editions_target_id_targets_target_id_fk"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "targets"
            referencedColumns: ["target_id"]
          },
          {
            foreignKeyName: "newsletter_editions_workspace_id_workspace_workspace_id_fk"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspace"
            referencedColumns: ["workspace_id"]
          },
        ]
      }
      newsletter_run_steps: {
        Row: {
          accurated_tokens: number
          error_summary: string | null
          finished_at: string | null
          idempotency_key: string | null
          log_ref: string | null
          process_time_json: Json
          run_id: string
          run_step_id: string
          started_at: string | null
          status: Database["public"]["Enums"]["step_status"]
          step: Database["public"]["Enums"]["step_name"]
          try_count: number
          workspace_id: string
        }
        Insert: {
          accurated_tokens?: number
          error_summary?: string | null
          finished_at?: string | null
          idempotency_key?: string | null
          log_ref?: string | null
          process_time_json?: Json
          run_id: string
          run_step_id?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["step_status"]
          step: Database["public"]["Enums"]["step_name"]
          try_count?: number
          workspace_id: string
        }
        Update: {
          accurated_tokens?: number
          error_summary?: string | null
          finished_at?: string | null
          idempotency_key?: string | null
          log_ref?: string | null
          process_time_json?: Json
          run_id?: string
          run_step_id?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["step_status"]
          step?: Database["public"]["Enums"]["step_name"]
          try_count?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "newsletter_run_steps_log_ref_run_logs_run_log_id_fk"
            columns: ["log_ref"]
            isOneToOne: false
            referencedRelation: "run_logs"
            referencedColumns: ["run_log_id"]
          },
          {
            foreignKeyName: "newsletter_run_steps_run_id_newsletter_runs_run_id_fk"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "newsletter_runs"
            referencedColumns: ["run_id"]
          },
          {
            foreignKeyName: "newsletter_run_steps_workspace_id_workspace_workspace_id_fk"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspace"
            referencedColumns: ["workspace_id"]
          },
        ]
      }
      newsletter_runs: {
        Row: {
          archived_at: string | null
          canary_percent: number | null
          cancel_reason: string | null
          finished_at: string | null
          is_archived: boolean
          log_ref: string | null
          metrics_json: Json
          resume_of_run_id: string | null
          rule_set_id: string | null
          run_id: string
          started_at: string
          status: Database["public"]["Enums"]["run_status"]
          trigger: string
          workspace_id: string
        }
        Insert: {
          archived_at?: string | null
          canary_percent?: number | null
          cancel_reason?: string | null
          finished_at?: string | null
          is_archived?: boolean
          log_ref?: string | null
          metrics_json?: Json
          resume_of_run_id?: string | null
          rule_set_id?: string | null
          run_id?: string
          started_at?: string
          status?: Database["public"]["Enums"]["run_status"]
          trigger: string
          workspace_id: string
        }
        Update: {
          archived_at?: string | null
          canary_percent?: number | null
          cancel_reason?: string | null
          finished_at?: string | null
          is_archived?: boolean
          log_ref?: string | null
          metrics_json?: Json
          resume_of_run_id?: string | null
          rule_set_id?: string | null
          run_id?: string
          started_at?: string
          status?: Database["public"]["Enums"]["run_status"]
          trigger?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "newsletter_runs_log_ref_run_logs_run_log_id_fk"
            columns: ["log_ref"]
            isOneToOne: false
            referencedRelation: "run_logs"
            referencedColumns: ["run_log_id"]
          },
          {
            foreignKeyName: "newsletter_runs_rule_set_id_rule_sets_rule_set_id_fk"
            columns: ["rule_set_id"]
            isOneToOne: false
            referencedRelation: "rule_sets"
            referencedColumns: ["rule_set_id"]
          },
          {
            foreignKeyName: "newsletter_runs_workspace_id_workspace_workspace_id_fk"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspace"
            referencedColumns: ["workspace_id"]
          },
        ]
      }
      onboarding_states: {
        Row: {
          completed_at: string | null
          created_at: string
          first_mail_run_id: string | null
          first_mail_send: Database["public"]["Enums"]["first_mail_send"]
          github_connected: boolean
          is_completed: boolean
          onboarding_mode: Database["public"]["Enums"]["onboarding_type"]
          onboarding_step: Database["public"]["Enums"]["onboarding_step"]
          review_step: Database["public"]["Enums"]["review_step"] | null
          setup_integrations: Database["public"]["Enums"]["setup_integrations"]
          setup_mailing_list: Database["public"]["Enums"]["setup_mailing_list"]
          setup_targets: Database["public"]["Enums"]["setup_targets"]
          slack_connected: boolean
          target_configured: boolean
          updated_at: string
          workspace_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          first_mail_run_id?: string | null
          first_mail_send?: Database["public"]["Enums"]["first_mail_send"]
          github_connected?: boolean
          is_completed?: boolean
          onboarding_mode?: Database["public"]["Enums"]["onboarding_type"]
          onboarding_step?: Database["public"]["Enums"]["onboarding_step"]
          review_step?: Database["public"]["Enums"]["review_step"] | null
          setup_integrations?: Database["public"]["Enums"]["setup_integrations"]
          setup_mailing_list?: Database["public"]["Enums"]["setup_mailing_list"]
          setup_targets?: Database["public"]["Enums"]["setup_targets"]
          slack_connected?: boolean
          target_configured?: boolean
          updated_at?: string
          workspace_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          first_mail_run_id?: string | null
          first_mail_send?: Database["public"]["Enums"]["first_mail_send"]
          github_connected?: boolean
          is_completed?: boolean
          onboarding_mode?: Database["public"]["Enums"]["onboarding_type"]
          onboarding_step?: Database["public"]["Enums"]["onboarding_step"]
          review_step?: Database["public"]["Enums"]["review_step"] | null
          setup_integrations?: Database["public"]["Enums"]["setup_integrations"]
          setup_mailing_list?: Database["public"]["Enums"]["setup_mailing_list"]
          setup_targets?: Database["public"]["Enums"]["setup_targets"]
          slack_connected?: boolean
          target_configured?: boolean
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_states_first_mail_run_id_newsletter_runs_run_id_fk"
            columns: ["first_mail_run_id"]
            isOneToOne: false
            referencedRelation: "newsletter_runs"
            referencedColumns: ["run_id"]
          },
          {
            foreignKeyName: "onboarding_states_workspace_id_workspace_workspace_id_fk"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspace"
            referencedColumns: ["workspace_id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          billing_key: string
          created_at: string
          currency: string | null
          customer_key: string | null
          display_brand: string | null
          display_last4: string | null
          is_default: boolean
          issued_at: string | null
          metadata: Json | null
          method_id: string
          method_type: Database["public"]["Enums"]["payment_method_type"]
          pg_provider: string
          raw_data: Json | null
          region: string | null
          revoked_at: string | null
          status: Database["public"]["Enums"]["payment_method_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          billing_key: string
          created_at?: string
          currency?: string | null
          customer_key?: string | null
          display_brand?: string | null
          display_last4?: string | null
          is_default: boolean
          issued_at?: string | null
          metadata?: Json | null
          method_id?: string
          method_type: Database["public"]["Enums"]["payment_method_type"]
          pg_provider: string
          raw_data?: Json | null
          region?: string | null
          revoked_at?: string | null
          status: Database["public"]["Enums"]["payment_method_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          billing_key?: string
          created_at?: string
          currency?: string | null
          customer_key?: string | null
          display_brand?: string | null
          display_last4?: string | null
          is_default?: boolean
          issued_at?: string | null
          metadata?: Json | null
          method_id?: string
          method_type?: Database["public"]["Enums"]["payment_method_type"]
          pg_provider?: string
          raw_data?: Json | null
          region?: string | null
          revoked_at?: string | null
          status?: Database["public"]["Enums"]["payment_method_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          approved_at: string
          created_at: string
          currency: string | null
          metadata: Json
          order_id: string
          order_name: string
          payment_id: number
          payment_key: string
          pg_provider: string
          raw_data: Json
          receipt_url: string
          requested_at: string
          status: string
          stripe_invoice_id: string | null
          stripe_payment_intent_id: string | null
          total_amount: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          approved_at: string
          created_at?: string
          currency?: string | null
          metadata: Json
          order_id: string
          order_name: string
          payment_id?: never
          payment_key: string
          pg_provider: string
          raw_data: Json
          receipt_url: string
          requested_at: string
          status: string
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
          total_amount: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          approved_at?: string
          created_at?: string
          currency?: string | null
          metadata?: Json
          order_id?: string
          order_name?: string
          payment_id?: never
          payment_key?: string
          pg_provider?: string
          raw_data?: Json
          receipt_url?: string
          requested_at?: string
          status?: string
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
          total_amount?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      plan_limits: {
        Row: {
          max_daily_emails_per_week: number | null
          max_members_per_target: number | null
          max_monthly_emails_per_month: number | null
          max_targets: number | null
          max_weekly_emails_per_month: number | null
          max_workspaces: number | null
          plan_type: Database["public"]["Enums"]["plan_type"]
        }
        Insert: {
          max_daily_emails_per_week?: number | null
          max_members_per_target?: number | null
          max_monthly_emails_per_month?: number | null
          max_targets?: number | null
          max_weekly_emails_per_month?: number | null
          max_workspaces?: number | null
          plan_type: Database["public"]["Enums"]["plan_type"]
        }
        Update: {
          max_daily_emails_per_week?: number | null
          max_members_per_target?: number | null
          max_monthly_emails_per_month?: number | null
          max_targets?: number | null
          max_weekly_emails_per_month?: number | null
          max_workspaces?: number | null
          plan_type?: Database["public"]["Enums"]["plan_type"]
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          is_completed_onboarding: boolean
          marketing_consent: boolean
          name: string
          profile_id: string
          updated_at: string
          user_type: Database["public"]["Enums"]["user_type"]
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          is_completed_onboarding?: boolean
          marketing_consent?: boolean
          name: string
          profile_id: string
          updated_at?: string
          user_type?: Database["public"]["Enums"]["user_type"]
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          is_completed_onboarding?: boolean
          marketing_consent?: boolean
          name?: string
          profile_id?: string
          updated_at?: string
          user_type?: Database["public"]["Enums"]["user_type"]
        }
        Relationships: []
      }
      rule_set_activations: {
        Row: {
          activated_at: string
          activated_by: string | null
          is_active: boolean
          rule_set_act_id: string
          rule_set_id: string
          scope: string
          target_id: string | null
          workspace_id: string
        }
        Insert: {
          activated_at?: string
          activated_by?: string | null
          is_active?: boolean
          rule_set_act_id?: string
          rule_set_id: string
          scope: string
          target_id?: string | null
          workspace_id: string
        }
        Update: {
          activated_at?: string
          activated_by?: string | null
          is_active?: boolean
          rule_set_act_id?: string
          rule_set_id?: string
          scope?: string
          target_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rule_set_activations_rule_set_id_rule_sets_rule_set_id_fk"
            columns: ["rule_set_id"]
            isOneToOne: false
            referencedRelation: "rule_sets"
            referencedColumns: ["rule_set_id"]
          },
          {
            foreignKeyName: "rule_set_activations_target_id_targets_target_id_fk"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "targets"
            referencedColumns: ["target_id"]
          },
          {
            foreignKeyName: "rule_set_activations_workspace_id_workspace_workspace_id_fk"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspace"
            referencedColumns: ["workspace_id"]
          },
        ]
      }
      rule_sets: {
        Row: {
          agents_version_id: string | null
          created_at: string
          created_by: string | null
          note: string | null
          rule_set_id: string
          tag: string | null
          tasks_version_id: string | null
          workspace_id: string
        }
        Insert: {
          agents_version_id?: string | null
          created_at?: string
          created_by?: string | null
          note?: string | null
          rule_set_id?: string
          tag?: string | null
          tasks_version_id?: string | null
          workspace_id: string
        }
        Update: {
          agents_version_id?: string | null
          created_at?: string
          created_by?: string | null
          note?: string | null
          rule_set_id?: string
          tag?: string | null
          tasks_version_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rule_sets_agents_version_id_rule_versions_rule_ver_id_fk"
            columns: ["agents_version_id"]
            isOneToOne: false
            referencedRelation: "rule_versions"
            referencedColumns: ["rule_ver_id"]
          },
          {
            foreignKeyName: "rule_sets_tasks_version_id_rule_versions_rule_ver_id_fk"
            columns: ["tasks_version_id"]
            isOneToOne: false
            referencedRelation: "rule_versions"
            referencedColumns: ["rule_ver_id"]
          },
          {
            foreignKeyName: "rule_sets_workspace_id_workspace_workspace_id_fk"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspace"
            referencedColumns: ["workspace_id"]
          },
        ]
      }
      rule_versions: {
        Row: {
          content_yaml: string
          created_at: string
          created_by: string | null
          file_hash: string
          note: string | null
          rule_ver_id: string
          schema_version: string
          type: Database["public"]["Enums"]["rule_type"]
          workspace_id: string
        }
        Insert: {
          content_yaml: string
          created_at?: string
          created_by?: string | null
          file_hash: string
          note?: string | null
          rule_ver_id?: string
          schema_version?: string
          type: Database["public"]["Enums"]["rule_type"]
          workspace_id: string
        }
        Update: {
          content_yaml?: string
          created_at?: string
          created_by?: string | null
          file_hash?: string
          note?: string | null
          rule_ver_id?: string
          schema_version?: string
          type?: Database["public"]["Enums"]["rule_type"]
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rule_versions_workspace_id_workspace_workspace_id_fk"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspace"
            referencedColumns: ["workspace_id"]
          },
        ]
      }
      run_logs: {
        Row: {
          bytes: number | null
          created_at: string
          run_log_id: string
          storage_url: string
          workspace_id: string
        }
        Insert: {
          bytes?: number | null
          created_at?: string
          run_log_id?: string
          storage_url: string
          workspace_id: string
        }
        Update: {
          bytes?: number | null
          created_at?: string
          run_log_id?: string
          storage_url?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "run_logs_workspace_id_workspace_workspace_id_fk"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspace"
            referencedColumns: ["workspace_id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          billing_currency: string
          billing_interval: Database["public"]["Enums"]["billing_interval"]
          billing_region: string
          created_at: string
          ends_at: string | null
          latest_payment_id: number | null
          mode: Database["public"]["Enums"]["subscription_mode"]
          payment_method_id: string | null
          plan_type: Database["public"]["Enums"]["plan_type"]
          started_at: string
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_price_id: string | null
          stripe_subscription_id: string | null
          subscription_id: string
          trial_ends_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          billing_currency?: string
          billing_interval?: Database["public"]["Enums"]["billing_interval"]
          billing_region?: string
          created_at?: string
          ends_at?: string | null
          latest_payment_id?: number | null
          mode?: Database["public"]["Enums"]["subscription_mode"]
          payment_method_id?: string | null
          plan_type: Database["public"]["Enums"]["plan_type"]
          started_at: string
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          subscription_id?: string
          trial_ends_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          billing_currency?: string
          billing_interval?: Database["public"]["Enums"]["billing_interval"]
          billing_region?: string
          created_at?: string
          ends_at?: string | null
          latest_payment_id?: number | null
          mode?: Database["public"]["Enums"]["subscription_mode"]
          payment_method_id?: string | null
          plan_type?: Database["public"]["Enums"]["plan_type"]
          started_at?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          subscription_id?: string
          trial_ends_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_latest_payment_id_payments_payment_id_fk"
            columns: ["latest_payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["payment_id"]
          },
          {
            foreignKeyName: "subscriptions_payment_method_id_payment_methods_method_id_fk"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["method_id"]
          },
        ]
      }
      target_source_policy: {
        Row: {
          max_count: number | null
          plan_type: Database["public"]["Enums"]["plan_type"]
          policy_id: string
          source_type: Database["public"]["Enums"]["source_type"]
        }
        Insert: {
          max_count?: number | null
          plan_type: Database["public"]["Enums"]["plan_type"]
          policy_id?: string
          source_type: Database["public"]["Enums"]["source_type"]
        }
        Update: {
          max_count?: number | null
          plan_type?: Database["public"]["Enums"]["plan_type"]
          policy_id?: string
          source_type?: Database["public"]["Enums"]["source_type"]
        }
        Relationships: []
      }
      target_sources: {
        Row: {
          created_at: string
          filter_json: Json
          integration_id: string
          is_active: boolean
          is_member_mail: boolean
          priority: number
          source_ident: string
          source_type: string
          target_id: string
          target_source_id: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          filter_json?: Json
          integration_id: string
          is_active?: boolean
          is_member_mail?: boolean
          priority?: number
          source_ident: string
          source_type: string
          target_id: string
          target_source_id?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          filter_json?: Json
          integration_id?: string
          is_active?: boolean
          is_member_mail?: boolean
          priority?: number
          source_ident?: string
          source_type?: string
          target_id?: string
          target_source_id?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "target_sources_integration_id_integrations_integration_id_fk"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "integrations"
            referencedColumns: ["integration_id"]
          },
          {
            foreignKeyName: "target_sources_integration_id_integrations_integration_id_fk"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "v_integration_info"
            referencedColumns: ["integration_id"]
          },
          {
            foreignKeyName: "target_sources_integration_id_integrations_integration_id_fk"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "v_integration_is_connected"
            referencedColumns: ["integration_id"]
          },
          {
            foreignKeyName: "target_sources_target_id_targets_target_id_fk"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "targets"
            referencedColumns: ["target_id"]
          },
          {
            foreignKeyName: "target_sources_workspace_id_workspace_workspace_id_fk"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspace"
            referencedColumns: ["workspace_id"]
          },
        ]
      }
      targets: {
        Row: {
          category: Database["public"]["Enums"]["category_type"]
          created_at: string
          default_rule_set_id: string | null
          display_name: string
          is_active: boolean
          is_member_mail: boolean
          language: Database["public"]["Enums"]["language"]
          last_run_id: string | null
          last_sent_at: string | null
          mailing_list_id: string | null
          preview_thumb_url: string | null
          schedule_cron: string | null
          schedule_hour: number
          target_id: string
          timezone: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["category_type"]
          created_at?: string
          default_rule_set_id?: string | null
          display_name: string
          is_active?: boolean
          is_member_mail?: boolean
          language?: Database["public"]["Enums"]["language"]
          last_run_id?: string | null
          last_sent_at?: string | null
          mailing_list_id?: string | null
          preview_thumb_url?: string | null
          schedule_cron?: string | null
          schedule_hour?: number
          target_id?: string
          timezone?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          category?: Database["public"]["Enums"]["category_type"]
          created_at?: string
          default_rule_set_id?: string | null
          display_name?: string
          is_active?: boolean
          is_member_mail?: boolean
          language?: Database["public"]["Enums"]["language"]
          last_run_id?: string | null
          last_sent_at?: string | null
          mailing_list_id?: string | null
          preview_thumb_url?: string | null
          schedule_cron?: string | null
          schedule_hour?: number
          target_id?: string
          timezone?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "targets_default_rule_set_id_rule_sets_rule_set_id_fk"
            columns: ["default_rule_set_id"]
            isOneToOne: false
            referencedRelation: "rule_sets"
            referencedColumns: ["rule_set_id"]
          },
          {
            foreignKeyName: "targets_last_run_id_newsletter_runs_run_id_fk"
            columns: ["last_run_id"]
            isOneToOne: false
            referencedRelation: "newsletter_runs"
            referencedColumns: ["run_id"]
          },
          {
            foreignKeyName: "targets_mailing_list_id_mail_list_mailing_list_id_fk"
            columns: ["mailing_list_id"]
            isOneToOne: false
            referencedRelation: "mail_list"
            referencedColumns: ["mailing_list_id"]
          },
          {
            foreignKeyName: "targets_workspace_id_workspace_workspace_id_fk"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspace"
            referencedColumns: ["workspace_id"]
          },
        ]
      }
      usage_counters: {
        Row: {
          accurated_token_count: number
          counter_id: string
          created_at: string
          email_sent_count: number
          mode: Database["public"]["Enums"]["subscription_mode"]
          period_end: string
          period_start: string
          period_type: Database["public"]["Enums"]["period_type"]
          process_count: number
          user_id: string
        }
        Insert: {
          accurated_token_count?: number
          counter_id?: string
          created_at?: string
          email_sent_count: number
          mode: Database["public"]["Enums"]["subscription_mode"]
          period_end: string
          period_start: string
          period_type: Database["public"]["Enums"]["period_type"]
          process_count: number
          user_id: string
        }
        Update: {
          accurated_token_count?: number
          counter_id?: string
          created_at?: string
          email_sent_count?: number
          mode?: Database["public"]["Enums"]["subscription_mode"]
          period_end?: string
          period_start?: string
          period_type?: Database["public"]["Enums"]["period_type"]
          process_count?: number
          user_id?: string
        }
        Relationships: []
      }
      workspace: {
        Row: {
          created_at: string
          is_default_workspace: boolean
          is_onboarding_completed: boolean
          kind: Database["public"]["Enums"]["workspace_kind"]
          name: string
          owner_user_id: string | null
          slug: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          is_default_workspace?: boolean
          is_onboarding_completed?: boolean
          kind?: Database["public"]["Enums"]["workspace_kind"]
          name: string
          owner_user_id?: string | null
          slug?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Update: {
          created_at?: string
          is_default_workspace?: boolean
          is_onboarding_completed?: boolean
          kind?: Database["public"]["Enums"]["workspace_kind"]
          name?: string
          owner_user_id?: string | null
          slug?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: []
      }
      workspace_member: {
        Row: {
          created_at: string
          invited_by: string | null
          role: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          invited_by?: string | null
          role?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          invited_by?: string | null
          role?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_member_workspace_id_workspace_workspace_id_fk"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspace"
            referencedColumns: ["workspace_id"]
          },
        ]
      }
    }
    Views: {
      v_integration_info: {
        Row: {
          api_key_ref: string | null
          computed_status:
            | Database["public"]["Enums"]["connection_status"]
            | null
          config_json: Json | null
          connection_status:
            | Database["public"]["Enums"]["connection_status"]
            | null
          created_at: string | null
          created_by: string | null
          credential_ref: string | null
          expires_at: string | null
          integration_id: string | null
          is_active: boolean | null
          last_checked_at: string | null
          last_ok_at: string | null
          minutes_since_last_check: number | null
          minutes_since_last_ok: number | null
          minutes_until_expiry: number | null
          name: string | null
          permissions_json: Json | null
          provider_error_code: string | null
          provider_error_message: string | null
          resource_cache_json: Json | null
          type: Database["public"]["Enums"]["integration_type"] | null
          updated_at: string | null
          webhook_url: string | null
          workspace_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integrations_workspace_id_workspace_workspace_id_fk"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspace"
            referencedColumns: ["workspace_id"]
          },
        ]
      }
      v_integration_is_connected: {
        Row: {
          integration_id: string | null
          is_connected: boolean | null
        }
        Relationships: []
      }
    }
    Functions: {
      pop_mailer: { Args: never; Returns: Json }
      secret_delete: { Args: { p_name: string }; Returns: undefined }
      secret_delete_by_ref: {
        Args: { p_credential_ref: string }
        Returns: undefined
      }
      secret_insert: {
        Args: { p_desc?: string; p_name: string; p_value: string }
        Returns: string
      }
      secret_read: { Args: { p_name: string }; Returns: string }
      secret_read_by_ref: {
        Args: { p_credential_ref: string }
        Returns: string
      }
      secret_store_by_ref: {
        Args: { p_credential_ref: string; p_value: string }
        Returns: string
      }
      secret_update: {
        Args: {
          p_id: string
          p_new_desc?: string
          p_new_name?: string
          p_new_value: string
        }
        Returns: undefined
      }
      secret_update_by_ref: {
        Args: { p_credential_ref: string; p_new_value: string }
        Returns: undefined
      }
    }
    Enums: {
      audit_action: "insert" | "update" | "delete"
      billing_interval: "weekly" | "monthly" | "yearly"
      category_type:
        | "development"
        | "infrastructure"
        | "qa"
        | "data_ai"
        | "product"
        | "design"
        | "operations"
        | "communication"
        | "community"
        | "learning"
        | "business"
        | "finance"
        | "hr"
        | "okr"
        | "personal"
        | "fun"
      connection_status:
        | "connected"
        | "expired"
        | "revoked"
        | "unauthorized"
        | "error"
        | "never"
        | "disconnected"
      delivery_event_type_email:
        | "delivered"
        | "opened"
        | "clicked"
        | "bounced"
        | "complained"
        | "dropped"
      first_mail_send: "waiting_choice" | "yes" | "no"
      installation_request_status:
        | "pending"
        | "approved"
        | "rejected"
        | "expired"
      integration_type:
        | "slack"
        | "github"
        | "discord"
        | "lineworks"
        | "slack_user"
      job_status: "queued" | "processing" | "done" | "failed" | "canceled"
      job_type:
        | "nexletter_generate"
        | "nexletter_retry"
        | "maintenance"
        | "billing_renewal"
        | "billing_all_renewals"
      language: "en" | "ja" | "ko"
      mail_status: "sending" | "delivered" | "partial" | "failed"
      onboarding_step:
        | "welcome"
        | "setup_integrations"
        | "setup_mailing_list"
        | "setup_targets"
        | "first_mail_sending"
        | "completed"
      onboarding_type: "default" | "slack_review"
      payment_method_status: "active" | "suspended" | "expired" | "revoked"
      payment_method_type: "card" | "bank" | "wallet"
      period: "daily" | "weekly" | "monthly" | "yearly"
      period_type: "hourly" | "daily" | "weekly" | "monthly"
      plan_type: "trial" | "free" | "starter" | "pro" | "enterprise"
      review_step:
        | "review_start"
        | "review_connect"
        | "review_setup_channel"
        | "review_collecting_data"
        | "review_completed"
      rule_type: "agents" | "tasks"
      run_status: "queued" | "running" | "success" | "failed" | "canceled"
      setup_integrations:
        | "start"
        | "connect_github"
        | "connect_slack"
        | "setup_slack_channel"
        | "end"
      setup_mailing_list: "start" | "regist_basic" | "regist_address" | "end"
      setup_targets:
        | "start"
        | "regist_basic"
        | "regist_schedule"
        | "regist_sourses"
        | "end"
      source_type:
        | "slack_channel"
        | "slack_thread"
        | "github_repo"
        | "github_search"
      step_name:
        | "queued"
        | "collect_data"
        | "summarize_data"
        | "assemble_data"
        | "finalize_data"
        | "send_email"
      step_status: "queued" | "running" | "success" | "failed" | "canceled"
      subscription_mode: "experiment" | "free" | "paid"
      subscription_status:
        | "trialing"
        | "active"
        | "paused"
        | "expired"
        | "canceled"
      user_type: "normal" | "nexletter" | "app_review"
      workspace_kind:
        | "org"
        | "team"
        | "personal"
        | "community"
        | "company"
        | "school"
        | "government"
        | "club"
        | "nexletter"
        | "app_review"
        | "other"
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
      audit_action: ["insert", "update", "delete"],
      billing_interval: ["weekly", "monthly", "yearly"],
      category_type: [
        "development",
        "infrastructure",
        "qa",
        "data_ai",
        "product",
        "design",
        "operations",
        "communication",
        "community",
        "learning",
        "business",
        "finance",
        "hr",
        "okr",
        "personal",
        "fun",
      ],
      connection_status: [
        "connected",
        "expired",
        "revoked",
        "unauthorized",
        "error",
        "never",
        "disconnected",
      ],
      delivery_event_type_email: [
        "delivered",
        "opened",
        "clicked",
        "bounced",
        "complained",
        "dropped",
      ],
      first_mail_send: ["waiting_choice", "yes", "no"],
      installation_request_status: [
        "pending",
        "approved",
        "rejected",
        "expired",
      ],
      integration_type: [
        "slack",
        "github",
        "discord",
        "lineworks",
        "slack_user",
      ],
      job_status: ["queued", "processing", "done", "failed", "canceled"],
      job_type: [
        "nexletter_generate",
        "nexletter_retry",
        "maintenance",
        "billing_renewal",
        "billing_all_renewals",
      ],
      language: ["en", "ja", "ko"],
      mail_status: ["sending", "delivered", "partial", "failed"],
      onboarding_step: [
        "welcome",
        "setup_integrations",
        "setup_mailing_list",
        "setup_targets",
        "first_mail_sending",
        "completed",
      ],
      onboarding_type: ["default", "slack_review"],
      payment_method_status: ["active", "suspended", "expired", "revoked"],
      payment_method_type: ["card", "bank", "wallet"],
      period: ["daily", "weekly", "monthly", "yearly"],
      period_type: ["hourly", "daily", "weekly", "monthly"],
      plan_type: ["trial", "free", "starter", "pro", "enterprise"],
      review_step: [
        "review_start",
        "review_connect",
        "review_setup_channel",
        "review_collecting_data",
        "review_completed",
      ],
      rule_type: ["agents", "tasks"],
      run_status: ["queued", "running", "success", "failed", "canceled"],
      setup_integrations: [
        "start",
        "connect_github",
        "connect_slack",
        "setup_slack_channel",
        "end",
      ],
      setup_mailing_list: ["start", "regist_basic", "regist_address", "end"],
      setup_targets: [
        "start",
        "regist_basic",
        "regist_schedule",
        "regist_sourses",
        "end",
      ],
      source_type: [
        "slack_channel",
        "slack_thread",
        "github_repo",
        "github_search",
      ],
      step_name: [
        "queued",
        "collect_data",
        "summarize_data",
        "assemble_data",
        "finalize_data",
        "send_email",
      ],
      step_status: ["queued", "running", "success", "failed", "canceled"],
      subscription_mode: ["experiment", "free", "paid"],
      subscription_status: [
        "trialing",
        "active",
        "paused",
        "expired",
        "canceled",
      ],
      user_type: ["normal", "nexletter", "app_review"],
      workspace_kind: [
        "org",
        "team",
        "personal",
        "community",
        "company",
        "school",
        "government",
        "club",
        "nexletter",
        "app_review",
        "other",
      ],
    },
  },
} as const
