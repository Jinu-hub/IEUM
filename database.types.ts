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
      highlights: {
        Row: {
          archived_at: string | null
          dedup_key: string | null
          highlight_id: string
          is_archived: boolean
          meta_json: Json
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
          dedup_key?: string | null
          highlight_id?: string
          is_archived?: boolean
          meta_json?: Json
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
          dedup_key?: string | null
          highlight_id?: string
          is_archived?: boolean
          meta_json?: Json
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
          html_body: string
          is_archived: boolean
          provider_message_id: string | null
          run_id: string | null
          sent_at: string | null
          stats_json: Json
          subject: string | null
          target_id: string
          text_body: string | null
          workspace_id: string
        }
        Insert: {
          archive_url?: string | null
          archived_at?: string | null
          edition_id?: string
          html_body: string
          is_archived?: boolean
          provider_message_id?: string | null
          run_id?: string | null
          sent_at?: string | null
          stats_json?: Json
          subject?: string | null
          target_id: string
          text_body?: string | null
          workspace_id: string
        }
        Update: {
          archive_url?: string | null
          archived_at?: string | null
          edition_id?: string
          html_body?: string
          is_archived?: boolean
          provider_message_id?: string | null
          run_id?: string | null
          sent_at?: string | null
          stats_json?: Json
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
          error_summary: string | null
          finished_at: string | null
          idempotency_key: string | null
          log_ref: string | null
          run_id: string
          run_step_id: string
          started_at: string | null
          status: Database["public"]["Enums"]["step_status"]
          step: Database["public"]["Enums"]["step_name"]
          try_count: number
          workspace_id: string
        }
        Insert: {
          error_summary?: string | null
          finished_at?: string | null
          idempotency_key?: string | null
          log_ref?: string | null
          run_id: string
          run_step_id?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["step_status"]
          step: Database["public"]["Enums"]["step_name"]
          try_count?: number
          workspace_id: string
        }
        Update: {
          error_summary?: string | null
          finished_at?: string | null
          idempotency_key?: string | null
          log_ref?: string | null
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
      payments: {
        Row: {
          approved_at: string
          created_at: string
          metadata: Json
          order_id: string
          order_name: string
          payment_id: number
          payment_key: string
          raw_data: Json
          receipt_url: string
          requested_at: string
          status: string
          total_amount: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          approved_at: string
          created_at?: string
          metadata: Json
          order_id: string
          order_name: string
          payment_id?: never
          payment_key: string
          raw_data: Json
          receipt_url: string
          requested_at: string
          status: string
          total_amount: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          approved_at?: string
          created_at?: string
          metadata?: Json
          order_id?: string
          order_name?: string
          payment_id?: never
          payment_key?: string
          raw_data?: Json
          receipt_url?: string
          requested_at?: string
          status?: string
          total_amount?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          marketing_consent: boolean
          name: string
          profile_id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          marketing_consent?: boolean
          name: string
          profile_id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          marketing_consent?: boolean
          name?: string
          profile_id?: string
          updated_at?: string
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
      target_sources: {
        Row: {
          created_at: string
          filter_json: Json
          integration_id: string
          is_active: boolean
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
          created_at: string
          default_rule_set_id: string | null
          display_name: string
          is_active: boolean
          last_run_id: string | null
          last_sent_at: string | null
          mailing_list_id: string | null
          preview_thumb_url: string | null
          schedule_cron: string | null
          target_id: string
          timezone: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          default_rule_set_id?: string | null
          display_name: string
          is_active?: boolean
          last_run_id?: string | null
          last_sent_at?: string | null
          mailing_list_id?: string | null
          preview_thumb_url?: string | null
          schedule_cron?: string | null
          target_id?: string
          timezone?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          default_rule_set_id?: string | null
          display_name?: string
          is_active?: boolean
          last_run_id?: string | null
          last_sent_at?: string | null
          mailing_list_id?: string | null
          preview_thumb_url?: string | null
          schedule_cron?: string | null
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
      workspace: {
        Row: {
          created_at: string
          kind: string
          name: string
          owner_user_id: string | null
          slug: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          kind?: string
          name: string
          owner_user_id?: string | null
          slug?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Update: {
          created_at?: string
          kind?: string
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
      [_ in never]: never
    }
    Enums: {
      audit_action: "insert" | "update" | "delete"
      connection_status:
        | "connected"
        | "expired"
        | "revoked"
        | "unauthorized"
        | "error"
        | "never"
      delivery_event_type_email:
        | "delivered"
        | "opened"
        | "clicked"
        | "bounced"
        | "complained"
        | "dropped"
      integration_type: "slack" | "github" | "discord" | "lineworks"
      rule_type: "agents" | "tasks"
      run_status: "queued" | "running" | "success" | "failed" | "canceled"
      step_name:
        | "collector_slack"
        | "collector_github"
        | "summarizer"
        | "assembler"
        | "sender_email"
      step_status: "queued" | "running" | "success" | "failed" | "skipped"
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
      connection_status: [
        "connected",
        "expired",
        "revoked",
        "unauthorized",
        "error",
        "never",
      ],
      delivery_event_type_email: [
        "delivered",
        "opened",
        "clicked",
        "bounced",
        "complained",
        "dropped",
      ],
      integration_type: ["slack", "github", "discord", "lineworks"],
      rule_type: ["agents", "tasks"],
      run_status: ["queued", "running", "success", "failed", "canceled"],
      step_name: [
        "collector_slack",
        "collector_github",
        "summarizer",
        "assembler",
        "sender_email",
      ],
      step_status: ["queued", "running", "success", "failed", "skipped"],
    },
  },
} as const
