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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      action_items: {
        Row: {
          assessment_id: string | null
          assigned_to: string | null
          category: string
          completed_at: string | null
          created_at: string
          created_by: string | null
          description: string
          due_date: string | null
          estimated_effort: number | null
          estimated_value: number | null
          findings: string[] | null
          id: string
          priority: string
          recommendations: string[] | null
          status: string
          tags: string[] | null
          tenant_id: string
          title: string
          updated_at: string
        }
        Insert: {
          assessment_id?: string | null
          assigned_to?: string | null
          category: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description: string
          due_date?: string | null
          estimated_effort?: number | null
          estimated_value?: number | null
          findings?: string[] | null
          id?: string
          priority?: string
          recommendations?: string[] | null
          status?: string
          tags?: string[] | null
          tenant_id: string
          title: string
          updated_at?: string
        }
        Update: {
          assessment_id?: string | null
          assigned_to?: string | null
          category?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          due_date?: string | null
          estimated_effort?: number | null
          estimated_value?: number | null
          findings?: string[] | null
          id?: string
          priority?: string
          recommendations?: string[] | null
          status?: string
          tags?: string[] | null
          tenant_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      ai_requests: {
        Row: {
          completed_at: string | null
          confidence_score: number | null
          context_data: Json | null
          cost: number | null
          created_at: string
          error_code: string | null
          error_message: string | null
          expires_at: string | null
          fallback_reason: string | null
          fallback_used: boolean | null
          id: string
          latency_ms: number | null
          max_retries: number | null
          model: string | null
          prompt: string
          provider: string
          quality_score: number | null
          request_type: string
          response: string | null
          retry_count: number | null
          status: string
          tenant_id: string
          tokens_used: number | null
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          confidence_score?: number | null
          context_data?: Json | null
          cost?: number | null
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          expires_at?: string | null
          fallback_reason?: string | null
          fallback_used?: boolean | null
          id?: string
          latency_ms?: number | null
          max_retries?: number | null
          model?: string | null
          prompt: string
          provider?: string
          quality_score?: number | null
          request_type: string
          response?: string | null
          retry_count?: number | null
          status?: string
          tenant_id: string
          tokens_used?: number | null
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          confidence_score?: number | null
          context_data?: Json | null
          cost?: number | null
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          expires_at?: string | null
          fallback_reason?: string | null
          fallback_used?: boolean | null
          id?: string
          latency_ms?: number | null
          max_retries?: number | null
          model?: string | null
          prompt?: string
          provider?: string
          quality_score?: number | null
          request_type?: string
          response?: string | null
          retry_count?: number | null
          status?: string
          tenant_id?: string
          tokens_used?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      api_access_tokens: {
        Row: {
          allowed_ips: unknown[] | null
          allowed_origins: string[] | null
          created_at: string | null
          current_day_count: number | null
          current_hour_count: number | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          last_reset_day: string | null
          last_reset_hour: string | null
          last_used_at: string | null
          last_used_ip: unknown | null
          rate_limit_per_day: number | null
          rate_limit_per_hour: number | null
          scopes: string[]
          tenant_id: string
          token_hash: string
          token_name: string
          token_preview: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          allowed_ips?: unknown[] | null
          allowed_origins?: string[] | null
          created_at?: string | null
          current_day_count?: number | null
          current_hour_count?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          last_reset_day?: string | null
          last_reset_hour?: string | null
          last_used_at?: string | null
          last_used_ip?: unknown | null
          rate_limit_per_day?: number | null
          rate_limit_per_hour?: number | null
          scopes?: string[]
          tenant_id: string
          token_hash: string
          token_name: string
          token_preview: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          allowed_ips?: unknown[] | null
          allowed_origins?: string[] | null
          created_at?: string | null
          current_day_count?: number | null
          current_hour_count?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          last_reset_day?: string | null
          last_reset_hour?: string | null
          last_used_at?: string | null
          last_used_ip?: unknown | null
          rate_limit_per_day?: number | null
          rate_limit_per_hour?: number | null
          scopes?: string[]
          tenant_id?: string
          token_hash?: string
          token_name?: string
          token_preview?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_access_tokens_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_access_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      api_endpoints: {
        Row: {
          allowed_roles: Json | null
          api_key_required: boolean | null
          auth_required: boolean | null
          created_at: string | null
          deprecated: boolean | null
          deprecation_date: string | null
          description: string | null
          id: string
          is_active: boolean | null
          method: string
          path: string
          rate_limit_per_day: number | null
          rate_limit_per_hour: number | null
          rate_limit_per_minute: number | null
          replacement_endpoint: string | null
          request_schema: Json | null
          response_schema: Json | null
          tenant_id: string
          updated_at: string | null
          validation_enabled: boolean | null
          version: string | null
        }
        Insert: {
          allowed_roles?: Json | null
          api_key_required?: boolean | null
          auth_required?: boolean | null
          created_at?: string | null
          deprecated?: boolean | null
          deprecation_date?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          method: string
          path: string
          rate_limit_per_day?: number | null
          rate_limit_per_hour?: number | null
          rate_limit_per_minute?: number | null
          replacement_endpoint?: string | null
          request_schema?: Json | null
          response_schema?: Json | null
          tenant_id: string
          updated_at?: string | null
          validation_enabled?: boolean | null
          version?: string | null
        }
        Update: {
          allowed_roles?: Json | null
          api_key_required?: boolean | null
          auth_required?: boolean | null
          created_at?: string | null
          deprecated?: boolean | null
          deprecation_date?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          method?: string
          path?: string
          rate_limit_per_day?: number | null
          rate_limit_per_hour?: number | null
          rate_limit_per_minute?: number | null
          replacement_endpoint?: string | null
          request_schema?: Json | null
          response_schema?: Json | null
          tenant_id?: string
          updated_at?: string | null
          validation_enabled?: boolean | null
          version?: string | null
        }
        Relationships: []
      }
      api_request_logs: {
        Row: {
          api_key_id: string | null
          body: Json | null
          client_ip: unknown | null
          created_at: string | null
          duration_ms: number | null
          endpoint_id: string | null
          error_message: string | null
          error_stack: string | null
          headers: Json | null
          id: string
          method: string
          path: string
          query_params: Json | null
          rate_limit_hit: boolean | null
          rate_limit_remaining: number | null
          request_timestamp: string | null
          response_body: Json | null
          response_headers: Json | null
          response_timestamp: string | null
          status_code: number | null
          tenant_id: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          api_key_id?: string | null
          body?: Json | null
          client_ip?: unknown | null
          created_at?: string | null
          duration_ms?: number | null
          endpoint_id?: string | null
          error_message?: string | null
          error_stack?: string | null
          headers?: Json | null
          id?: string
          method: string
          path: string
          query_params?: Json | null
          rate_limit_hit?: boolean | null
          rate_limit_remaining?: number | null
          request_timestamp?: string | null
          response_body?: Json | null
          response_headers?: Json | null
          response_timestamp?: string | null
          status_code?: number | null
          tenant_id: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          api_key_id?: string | null
          body?: Json | null
          client_ip?: unknown | null
          created_at?: string | null
          duration_ms?: number | null
          endpoint_id?: string | null
          error_message?: string | null
          error_stack?: string | null
          headers?: Json | null
          id?: string
          method?: string
          path?: string
          query_params?: Json | null
          rate_limit_hit?: boolean | null
          rate_limit_remaining?: number | null
          request_timestamp?: string | null
          response_body?: Json | null
          response_headers?: Json | null
          response_timestamp?: string | null
          status_code?: number | null
          tenant_id?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_request_logs_endpoint_id_fkey"
            columns: ["endpoint_id"]
            isOneToOne: false
            referencedRelation: "api_endpoints"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_error_logs: {
        Row: {
          assessment_id: string | null
          context: Json | null
          created_at: string | null
          error_code: string | null
          error_details: Json | null
          error_message: string
          error_type: string
          id: string
          resolution_notes: string | null
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string | null
          tenant_id: string
        }
        Insert: {
          assessment_id?: string | null
          context?: Json | null
          created_at?: string | null
          error_code?: string | null
          error_details?: Json | null
          error_message: string
          error_type: string
          id?: string
          resolution_notes?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string | null
          tenant_id: string
        }
        Update: {
          assessment_id?: string | null
          context?: Json | null
          created_at?: string | null
          error_code?: string | null
          error_details?: Json | null
          error_message?: string
          error_type?: string
          id?: string
          resolution_notes?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string | null
          tenant_id?: string
        }
        Relationships: []
      }
      assessment_opportunities: {
        Row: {
          assessment_id: string
          assigned_to: string | null
          automation_errors: Json | null
          client_id: string
          created_at: string | null
          currency: string | null
          description: string | null
          detection_rules: Json | null
          due_date: string | null
          estimated_value: number | null
          follow_up_date: string | null
          id: string
          opportunity_type: string
          priority: Database["public"]["Enums"]["opportunity_priority"] | null
          status: Database["public"]["Enums"]["opportunity_status"] | null
          tenant_id: string
          threshold_data: Json | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assessment_id: string
          assigned_to?: string | null
          automation_errors?: Json | null
          client_id: string
          created_at?: string | null
          currency?: string | null
          description?: string | null
          detection_rules?: Json | null
          due_date?: string | null
          estimated_value?: number | null
          follow_up_date?: string | null
          id?: string
          opportunity_type: string
          priority?: Database["public"]["Enums"]["opportunity_priority"] | null
          status?: Database["public"]["Enums"]["opportunity_status"] | null
          tenant_id: string
          threshold_data?: Json | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assessment_id?: string
          assigned_to?: string | null
          automation_errors?: Json | null
          client_id?: string
          created_at?: string | null
          currency?: string | null
          description?: string | null
          detection_rules?: Json | null
          due_date?: string | null
          estimated_value?: number | null
          follow_up_date?: string | null
          id?: string
          opportunity_type?: string
          priority?: Database["public"]["Enums"]["opportunity_priority"] | null
          status?: Database["public"]["Enums"]["opportunity_status"] | null
          tenant_id?: string
          threshold_data?: Json | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      assessment_questions: {
        Row: {
          conditional_logic: Json | null
          created_at: string | null
          description: string | null
          help_text: string | null
          id: string
          max_points: number | null
          options: Json | null
          question_number: number
          question_text: string
          question_type: Database["public"]["Enums"]["question_type"]
          required: boolean | null
          scoring_weight: number | null
          section: string | null
          template_id: string
          tenant_id: string
          validation_rules: Json | null
        }
        Insert: {
          conditional_logic?: Json | null
          created_at?: string | null
          description?: string | null
          help_text?: string | null
          id?: string
          max_points?: number | null
          options?: Json | null
          question_number: number
          question_text: string
          question_type: Database["public"]["Enums"]["question_type"]
          required?: boolean | null
          scoring_weight?: number | null
          section?: string | null
          template_id: string
          tenant_id: string
          validation_rules?: Json | null
        }
        Update: {
          conditional_logic?: Json | null
          created_at?: string | null
          description?: string | null
          help_text?: string | null
          id?: string
          max_points?: number | null
          options?: Json | null
          question_number?: number
          question_text?: string
          question_type?: Database["public"]["Enums"]["question_type"]
          required?: boolean | null
          scoring_weight?: number | null
          section?: string | null
          template_id?: string
          tenant_id?: string
          validation_rules?: Json | null
        }
        Relationships: []
      }
      assessment_reports: {
        Row: {
          assessment_id: string
          created_at: string | null
          created_by: string | null
          email_errors: Json | null
          email_recipients: Json | null
          email_sent: boolean | null
          error_details: Json | null
          export_formats: Json | null
          file_path: string | null
          generation_completed_at: string | null
          generation_started_at: string | null
          id: string
          max_retries: number | null
          report_data: Json | null
          report_type: string
          retry_count: number | null
          status: Database["public"]["Enums"]["report_status"] | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          assessment_id: string
          created_at?: string | null
          created_by?: string | null
          email_errors?: Json | null
          email_recipients?: Json | null
          email_sent?: boolean | null
          error_details?: Json | null
          export_formats?: Json | null
          file_path?: string | null
          generation_completed_at?: string | null
          generation_started_at?: string | null
          id?: string
          max_retries?: number | null
          report_data?: Json | null
          report_type: string
          retry_count?: number | null
          status?: Database["public"]["Enums"]["report_status"] | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          assessment_id?: string
          created_at?: string | null
          created_by?: string | null
          email_errors?: Json | null
          email_recipients?: Json | null
          email_sent?: boolean | null
          error_details?: Json | null
          export_formats?: Json | null
          file_path?: string | null
          generation_completed_at?: string | null
          generation_started_at?: string | null
          id?: string
          max_retries?: number | null
          report_data?: Json | null
          report_type?: string
          retry_count?: number | null
          status?: Database["public"]["Enums"]["report_status"] | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      assessment_reports_extended: {
        Row: {
          assessment_id: string
          created_at: string
          created_by: string | null
          downloaded_count: number | null
          error_message: string | null
          file_format: string
          file_path: string | null
          file_size_bytes: number | null
          generated_at: string | null
          generation_status: string
          id: string
          last_downloaded_at: string | null
          report_name: string
          report_type: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          assessment_id: string
          created_at?: string
          created_by?: string | null
          downloaded_count?: number | null
          error_message?: string | null
          file_format?: string
          file_path?: string | null
          file_size_bytes?: number | null
          generated_at?: string | null
          generation_status?: string
          id?: string
          last_downloaded_at?: string | null
          report_name: string
          report_type?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          assessment_id?: string
          created_at?: string
          created_by?: string | null
          downloaded_count?: number | null
          error_message?: string | null
          file_format?: string
          file_path?: string | null
          file_size_bytes?: number | null
          generated_at?: string | null
          generation_status?: string
          id?: string
          last_downloaded_at?: string | null
          report_name?: string
          report_type?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      assessment_responses: {
        Row: {
          assessment_id: string
          auto_saved: boolean | null
          created_at: string | null
          id: string
          question_id: string
          response_data: Json | null
          response_value: string | null
          score: number | null
          tenant_id: string
          updated_at: string | null
          validation_errors: Json | null
          validation_status: string | null
        }
        Insert: {
          assessment_id: string
          auto_saved?: boolean | null
          created_at?: string | null
          id?: string
          question_id: string
          response_data?: Json | null
          response_value?: string | null
          score?: number | null
          tenant_id: string
          updated_at?: string | null
          validation_errors?: Json | null
          validation_status?: string | null
        }
        Update: {
          assessment_id?: string
          auto_saved?: boolean | null
          created_at?: string | null
          id?: string
          question_id?: string
          response_data?: Json | null
          response_value?: string | null
          score?: number | null
          tenant_id?: string
          updated_at?: string | null
          validation_errors?: Json | null
          validation_status?: string | null
        }
        Relationships: []
      }
      assessment_templates: {
        Row: {
          category: string | null
          conditional_logic: Json | null
          created_at: string | null
          created_by: string | null
          description: string | null
          estimated_duration: number | null
          id: string
          is_active: boolean | null
          max_score: number | null
          name: string
          passing_score: number | null
          scoring_rules: Json | null
          status: Database["public"]["Enums"]["assessment_status"] | null
          tenant_id: string
          threshold_rules: Json | null
          updated_at: string | null
          validation_rules: Json | null
          version: number
        }
        Insert: {
          category?: string | null
          conditional_logic?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          estimated_duration?: number | null
          id?: string
          is_active?: boolean | null
          max_score?: number | null
          name: string
          passing_score?: number | null
          scoring_rules?: Json | null
          status?: Database["public"]["Enums"]["assessment_status"] | null
          tenant_id: string
          threshold_rules?: Json | null
          updated_at?: string | null
          validation_rules?: Json | null
          version?: number
        }
        Update: {
          category?: string | null
          conditional_logic?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          estimated_duration?: number | null
          id?: string
          is_active?: boolean | null
          max_score?: number | null
          name?: string
          passing_score?: number | null
          scoring_rules?: Json | null
          status?: Database["public"]["Enums"]["assessment_status"] | null
          tenant_id?: string
          threshold_rules?: Json | null
          updated_at?: string | null
          validation_rules?: Json | null
          version?: number
        }
        Relationships: []
      }
      assessments: {
        Row: {
          assessor_id: string | null
          client_id: string
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          current_question: number | null
          id: string
          last_saved_at: string | null
          max_possible_score: number | null
          percentage_score: number | null
          recovery_data: Json | null
          session_data: Json | null
          started_at: string | null
          status: Database["public"]["Enums"]["response_status"] | null
          template_id: string
          tenant_id: string
          total_score: number | null
          updated_at: string | null
          validation_errors: Json | null
        }
        Insert: {
          assessor_id?: string | null
          client_id: string
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          current_question?: number | null
          id?: string
          last_saved_at?: string | null
          max_possible_score?: number | null
          percentage_score?: number | null
          recovery_data?: Json | null
          session_data?: Json | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["response_status"] | null
          template_id: string
          tenant_id: string
          total_score?: number | null
          updated_at?: string | null
          validation_errors?: Json | null
        }
        Update: {
          assessor_id?: string | null
          client_id?: string
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          current_question?: number | null
          id?: string
          last_saved_at?: string | null
          max_possible_score?: number | null
          percentage_score?: number | null
          recovery_data?: Json | null
          session_data?: Json | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["response_status"] | null
          template_id?: string
          tenant_id?: string
          total_score?: number | null
          updated_at?: string | null
          validation_errors?: Json | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          additional_context: Json | null
          api_endpoint: string | null
          changes_summary: string | null
          created_at: string | null
          http_method: string | null
          id: string
          ip_address: unknown | null
          new_values: Json | null
          old_values: Json | null
          request_id: string | null
          resource_id: string | null
          resource_name: string | null
          resource_type: string
          risk_factors: string[] | null
          risk_level: string | null
          session_id: string | null
          tenant_id: string
          user_agent: string | null
          user_email: string | null
          user_id: string | null
          user_role: string | null
        }
        Insert: {
          action: string
          additional_context?: Json | null
          api_endpoint?: string | null
          changes_summary?: string | null
          created_at?: string | null
          http_method?: string | null
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          request_id?: string | null
          resource_id?: string | null
          resource_name?: string | null
          resource_type: string
          risk_factors?: string[] | null
          risk_level?: string | null
          session_id?: string | null
          tenant_id: string
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          user_role?: string | null
        }
        Update: {
          action?: string
          additional_context?: Json | null
          api_endpoint?: string | null
          changes_summary?: string | null
          created_at?: string | null
          http_method?: string | null
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          request_id?: string | null
          resource_id?: string | null
          resource_name?: string | null
          resource_type?: string
          risk_factors?: string[] | null
          risk_level?: string | null
          session_id?: string | null
          tenant_id?: string
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          user_role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "user_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      auth_events: {
        Row: {
          additional_data: Json | null
          created_at: string | null
          device_fingerprint: string | null
          error_code: string | null
          error_message: string | null
          event_type: Database["public"]["Enums"]["auth_event_type"]
          id: string
          ip_address: unknown | null
          location_data: Json | null
          success: boolean
          tenant_id: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          additional_data?: Json | null
          created_at?: string | null
          device_fingerprint?: string | null
          error_code?: string | null
          error_message?: string | null
          event_type: Database["public"]["Enums"]["auth_event_type"]
          id?: string
          ip_address?: unknown | null
          location_data?: Json | null
          success: boolean
          tenant_id: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          additional_data?: Json | null
          created_at?: string | null
          device_fingerprint?: string | null
          error_code?: string | null
          error_message?: string | null
          event_type?: Database["public"]["Enums"]["auth_event_type"]
          id?: string
          ip_address?: unknown | null
          location_data?: Json | null
          success?: boolean
          tenant_id?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "auth_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auth_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      auto_assignment_rules: {
        Row: {
          assigned_team: string | null
          assigned_user_id: string | null
          conditions: Json
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean | null
          name: string
          rule_order: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          assigned_team?: string | null
          assigned_user_id?: string | null
          conditions?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          rule_order?: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          assigned_team?: string | null
          assigned_user_id?: string | null
          conditions?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          rule_order?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "auto_assignment_rules_assigned_user_id_fkey"
            columns: ["assigned_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auto_assignment_rules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_workflows: {
        Row: {
          average_duration_ms: number | null
          conditions: Json | null
          created_at: string
          created_by: string | null
          description: string | null
          execution_count: number | null
          failure_count: number | null
          fallback_workflow_id: string | null
          id: string
          is_ai_powered: boolean | null
          last_executed_at: string | null
          name: string
          next_execution_at: string | null
          retry_config: Json | null
          status: string
          steps: Json
          success_count: number | null
          tenant_id: string
          timeout_seconds: number | null
          trigger_config: Json | null
          updated_at: string
          workflow_type: string
        }
        Insert: {
          average_duration_ms?: number | null
          conditions?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          execution_count?: number | null
          failure_count?: number | null
          fallback_workflow_id?: string | null
          id?: string
          is_ai_powered?: boolean | null
          last_executed_at?: string | null
          name: string
          next_execution_at?: string | null
          retry_config?: Json | null
          status?: string
          steps?: Json
          success_count?: number | null
          tenant_id: string
          timeout_seconds?: number | null
          trigger_config?: Json | null
          updated_at?: string
          workflow_type: string
        }
        Update: {
          average_duration_ms?: number | null
          conditions?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          execution_count?: number | null
          failure_count?: number | null
          fallback_workflow_id?: string | null
          id?: string
          is_ai_powered?: boolean | null
          last_executed_at?: string | null
          name?: string
          next_execution_at?: string | null
          retry_config?: Json | null
          status?: string
          steps?: Json
          success_count?: number | null
          tenant_id?: string
          timeout_seconds?: number | null
          trigger_config?: Json | null
          updated_at?: string
          workflow_type?: string
        }
        Relationships: []
      }
      bi_reports: {
        Row: {
          access_permissions: Json | null
          cache_ttl: number | null
          chart_config: Json | null
          created_at: string
          created_by: string | null
          data_sources: Json
          description: string | null
          error_count: number | null
          export_formats: string[] | null
          filters: Json | null
          generation_time_ms: number | null
          id: string
          is_public: boolean | null
          last_error: string | null
          last_generated_at: string | null
          name: string
          query_definition: Json
          report_type: string
          schedule_config: Json | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          access_permissions?: Json | null
          cache_ttl?: number | null
          chart_config?: Json | null
          created_at?: string
          created_by?: string | null
          data_sources?: Json
          description?: string | null
          error_count?: number | null
          export_formats?: string[] | null
          filters?: Json | null
          generation_time_ms?: number | null
          id?: string
          is_public?: boolean | null
          last_error?: string | null
          last_generated_at?: string | null
          name: string
          query_definition?: Json
          report_type: string
          schedule_config?: Json | null
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          access_permissions?: Json | null
          cache_ttl?: number | null
          chart_config?: Json | null
          created_at?: string
          created_by?: string | null
          data_sources?: Json
          description?: string | null
          error_count?: number | null
          export_formats?: string[] | null
          filters?: Json | null
          generation_time_ms?: number | null
          id?: string
          is_public?: boolean | null
          last_error?: string | null
          last_generated_at?: string | null
          name?: string
          query_definition?: Json
          report_type?: string
          schedule_config?: Json | null
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      capacity_metrics: {
        Row: {
          created_at: string | null
          critical_threshold: number | null
          current_usage: number
          growth_trend: string | null
          id: string
          max_capacity: number
          measured_at: string | null
          measurement_details: Json | null
          predicted_exhaustion_date: string | null
          resource_name: string
          resource_type: string
          tenant_id: string
          usage_percentage: number | null
          warning_threshold: number | null
        }
        Insert: {
          created_at?: string | null
          critical_threshold?: number | null
          current_usage: number
          growth_trend?: string | null
          id?: string
          max_capacity: number
          measured_at?: string | null
          measurement_details?: Json | null
          predicted_exhaustion_date?: string | null
          resource_name: string
          resource_type: string
          tenant_id: string
          usage_percentage?: number | null
          warning_threshold?: number | null
        }
        Update: {
          created_at?: string | null
          critical_threshold?: number | null
          current_usage?: number
          growth_trend?: string | null
          id?: string
          max_capacity?: number
          measured_at?: string | null
          measurement_details?: Json | null
          predicted_exhaustion_date?: string | null
          resource_name?: string
          resource_type?: string
          tenant_id?: string
          usage_percentage?: number | null
          warning_threshold?: number | null
        }
        Relationships: []
      }
      client_activities: {
        Row: {
          activity_data: Json | null
          activity_description: string | null
          activity_title: string
          activity_type: string
          client_id: string
          created_at: string
          id: string
          performed_by: string | null
          tenant_id: string
        }
        Insert: {
          activity_data?: Json | null
          activity_description?: string | null
          activity_title: string
          activity_type: string
          client_id: string
          created_at?: string
          id?: string
          performed_by?: string | null
          tenant_id: string
        }
        Update: {
          activity_data?: Json | null
          activity_description?: string | null
          activity_title?: string
          activity_type?: string
          client_id?: string
          created_at?: string
          id?: string
          performed_by?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_activities_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_activities_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_activities_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: Json | null
          company_size: string | null
          created_at: string
          created_by: string | null
          domains: string[] | null
          email: string | null
          health_score: number | null
          id: string
          industry: string | null
          last_activity_at: string | null
          name: string
          notes: string | null
          phone: string | null
          response_time_avg_hours: number | null
          risk_level: string | null
          satisfaction_rating: number | null
          status: string
          tenant_id: string
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: Json | null
          company_size?: string | null
          created_at?: string
          created_by?: string | null
          domains?: string[] | null
          email?: string | null
          health_score?: number | null
          id?: string
          industry?: string | null
          last_activity_at?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          response_time_avg_hours?: number | null
          risk_level?: string | null
          satisfaction_rating?: number | null
          status?: string
          tenant_id: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: Json | null
          company_size?: string | null
          created_at?: string
          created_by?: string | null
          domains?: string[] | null
          email?: string | null
          health_score?: number | null
          id?: string
          industry?: string | null
          last_activity_at?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          response_time_avg_hours?: number | null
          risk_level?: string | null
          satisfaction_rating?: number | null
          status?: string
          tenant_id?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_calculations: {
        Row: {
          adjustments: number | null
          base_amount: number
          calculation_details: Json | null
          calculation_period_end: string
          calculation_period_start: string
          commission_amount: number
          commission_rate: number
          commission_structure_id: string
          created_at: string
          final_amount: number
          id: string
          paid_at: string | null
          status: string
          tenant_id: string
          updated_at: string
          user_id: string
          verification_notes: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          adjustments?: number | null
          base_amount: number
          calculation_details?: Json | null
          calculation_period_end: string
          calculation_period_start: string
          commission_amount: number
          commission_rate: number
          commission_structure_id: string
          created_at?: string
          final_amount: number
          id?: string
          paid_at?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
          user_id: string
          verification_notes?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          adjustments?: number | null
          base_amount?: number
          calculation_details?: Json | null
          calculation_period_end?: string
          calculation_period_start?: string
          commission_amount?: number
          commission_rate?: number
          commission_structure_id?: string
          created_at?: string
          final_amount?: number
          id?: string
          paid_at?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
          user_id?: string
          verification_notes?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commission_calculations_commission_structure_id_fkey"
            columns: ["commission_structure_id"]
            isOneToOne: false
            referencedRelation: "commission_structures"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_structures: {
        Row: {
          base_rate: number | null
          calculation_basis: string
          commission_type: string
          created_at: string
          id: string
          is_active: boolean | null
          maximum_cap: number | null
          minimum_threshold: number | null
          payment_frequency: string | null
          structure_name: string
          tenant_id: string
          tier_rules: Json | null
          updated_at: string
        }
        Insert: {
          base_rate?: number | null
          calculation_basis: string
          commission_type: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          maximum_cap?: number | null
          minimum_threshold?: number | null
          payment_frequency?: string | null
          structure_name: string
          tenant_id: string
          tier_rules?: Json | null
          updated_at?: string
        }
        Update: {
          base_rate?: number | null
          calculation_basis?: string
          commission_type?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          maximum_cap?: number | null
          minimum_threshold?: number | null
          payment_frequency?: string | null
          structure_name?: string
          tenant_id?: string
          tier_rules?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          client_id: string
          created_at: string
          created_by: string | null
          department: string | null
          email: string
          first_name: string
          id: string
          is_active: boolean
          is_primary: boolean
          last_name: string
          notes: string | null
          phone: string | null
          tenant_id: string
          title: string | null
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          created_by?: string | null
          department?: string | null
          email: string
          first_name: string
          id?: string
          is_active?: boolean
          is_primary?: boolean
          last_name: string
          notes?: string | null
          phone?: string | null
          tenant_id: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          created_by?: string | null
          department?: string | null
          email?: string
          first_name?: string
          id?: string
          is_active?: boolean
          is_primary?: boolean
          last_name?: string
          notes?: string | null
          phone?: string | null
          tenant_id?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_approvals: {
        Row: {
          approval_level: number | null
          approved_at: string | null
          approver_id: string
          comments: string | null
          contract_id: string
          created_at: string | null
          id: string
          status: Database["public"]["Enums"]["approval_status"] | null
          tenant_id: string
          timeout_at: string | null
        }
        Insert: {
          approval_level?: number | null
          approved_at?: string | null
          approver_id: string
          comments?: string | null
          contract_id: string
          created_at?: string | null
          id?: string
          status?: Database["public"]["Enums"]["approval_status"] | null
          tenant_id: string
          timeout_at?: string | null
        }
        Update: {
          approval_level?: number | null
          approved_at?: string | null
          approver_id?: string
          comments?: string | null
          contract_id?: string
          created_at?: string | null
          id?: string
          status?: Database["public"]["Enums"]["approval_status"] | null
          tenant_id?: string
          timeout_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_approvals_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_audit_trail: {
        Row: {
          action: string
          contract_id: string
          created_at: string | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: unknown | null
          new_values: Json | null
          old_values: Json | null
          tenant_id: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          contract_id: string
          created_at?: string | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          tenant_id: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          contract_id?: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          tenant_id?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_audit_trail_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_error_logs: {
        Row: {
          context: Json | null
          contract_id: string | null
          created_at: string | null
          error_code: string | null
          error_details: Json | null
          error_message: string
          error_type: string
          id: string
          resolution_notes: string | null
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string | null
          tenant_id: string
        }
        Insert: {
          context?: Json | null
          contract_id?: string | null
          created_at?: string | null
          error_code?: string | null
          error_details?: Json | null
          error_message: string
          error_type: string
          id?: string
          resolution_notes?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string | null
          tenant_id: string
        }
        Update: {
          context?: Json | null
          contract_id?: string | null
          created_at?: string | null
          error_code?: string | null
          error_details?: Json | null
          error_message?: string
          error_type?: string
          id?: string
          resolution_notes?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_error_logs_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_payments: {
        Row: {
          amount_due: number
          amount_paid: number | null
          contract_id: string
          created_at: string | null
          currency: Database["public"]["Enums"]["currency_code"] | null
          due_date: string
          id: string
          invoice_number: string | null
          paid_at: string | null
          payment_errors: Json | null
          payment_method: string | null
          payment_status: string | null
          reconciliation_status: string | null
          tenant_id: string
          transaction_reference: string | null
        }
        Insert: {
          amount_due: number
          amount_paid?: number | null
          contract_id: string
          created_at?: string | null
          currency?: Database["public"]["Enums"]["currency_code"] | null
          due_date: string
          id?: string
          invoice_number?: string | null
          paid_at?: string | null
          payment_errors?: Json | null
          payment_method?: string | null
          payment_status?: string | null
          reconciliation_status?: string | null
          tenant_id: string
          transaction_reference?: string | null
        }
        Update: {
          amount_due?: number
          amount_paid?: number | null
          contract_id?: string
          created_at?: string | null
          currency?: Database["public"]["Enums"]["currency_code"] | null
          due_date?: string
          id?: string
          invoice_number?: string | null
          paid_at?: string | null
          payment_errors?: Json | null
          payment_method?: string | null
          payment_status?: string | null
          reconciliation_status?: string | null
          tenant_id?: string
          transaction_reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_payments_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_pricing_history: {
        Row: {
          calculation_details: Json | null
          change_reason: string | null
          change_type: string
          changed_at: string | null
          changed_by: string | null
          contract_id: string
          id: string
          new_values: Json | null
          old_values: Json | null
          tenant_id: string
          validation_errors: Json | null
        }
        Insert: {
          calculation_details?: Json | null
          change_reason?: string | null
          change_type: string
          changed_at?: string | null
          changed_by?: string | null
          contract_id: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          tenant_id: string
          validation_errors?: Json | null
        }
        Update: {
          calculation_details?: Json | null
          change_reason?: string | null
          change_type?: string
          changed_at?: string | null
          changed_by?: string | null
          contract_id?: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          tenant_id?: string
          validation_errors?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_pricing_history_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_templates: {
        Row: {
          contract_type: Database["public"]["Enums"]["contract_type"]
          created_at: string | null
          created_by: string | null
          default_pricing_type: Database["public"]["Enums"]["pricing_type"]
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          template_content: string
          tenant_id: string
          updated_at: string | null
          validation_rules: Json | null
          variables: Json | null
        }
        Insert: {
          contract_type: Database["public"]["Enums"]["contract_type"]
          created_at?: string | null
          created_by?: string | null
          default_pricing_type: Database["public"]["Enums"]["pricing_type"]
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          template_content: string
          tenant_id: string
          updated_at?: string | null
          validation_rules?: Json | null
          variables?: Json | null
        }
        Update: {
          contract_type?: Database["public"]["Enums"]["contract_type"]
          created_at?: string | null
          created_by?: string | null
          default_pricing_type?: Database["public"]["Enums"]["pricing_type"]
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          template_content?: string
          tenant_id?: string
          updated_at?: string | null
          validation_rules?: Json | null
          variables?: Json | null
        }
        Relationships: []
      }
      contracts: {
        Row: {
          approval_status: Database["public"]["Enums"]["approval_status"] | null
          approved_at: string | null
          approved_by: string | null
          auto_renewal: boolean | null
          client_id: string
          client_signature_data: Json | null
          client_signature_status: string | null
          client_signed_at: string | null
          content: string | null
          contract_number: string
          contract_type: Database["public"]["Enums"]["contract_type"]
          created_at: string | null
          created_by: string | null
          currency: Database["public"]["Enums"]["currency_code"] | null
          custom_clauses: Json | null
          description: string | null
          end_date: string | null
          id: string
          payment_terms: Database["public"]["Enums"]["payment_terms"] | null
          pricing_rule_id: string | null
          provider_signature_data: Json | null
          provider_signature_status: string | null
          provider_signed_at: string | null
          rejection_reason: string | null
          renewal_date: string | null
          renewal_period_months: number | null
          start_date: string
          status: Database["public"]["Enums"]["contract_status"] | null
          template_id: string | null
          tenant_id: string
          terms_and_conditions: string | null
          title: string
          total_value: number | null
          updated_at: string | null
        }
        Insert: {
          approval_status?:
            | Database["public"]["Enums"]["approval_status"]
            | null
          approved_at?: string | null
          approved_by?: string | null
          auto_renewal?: boolean | null
          client_id: string
          client_signature_data?: Json | null
          client_signature_status?: string | null
          client_signed_at?: string | null
          content?: string | null
          contract_number: string
          contract_type: Database["public"]["Enums"]["contract_type"]
          created_at?: string | null
          created_by?: string | null
          currency?: Database["public"]["Enums"]["currency_code"] | null
          custom_clauses?: Json | null
          description?: string | null
          end_date?: string | null
          id?: string
          payment_terms?: Database["public"]["Enums"]["payment_terms"] | null
          pricing_rule_id?: string | null
          provider_signature_data?: Json | null
          provider_signature_status?: string | null
          provider_signed_at?: string | null
          rejection_reason?: string | null
          renewal_date?: string | null
          renewal_period_months?: number | null
          start_date: string
          status?: Database["public"]["Enums"]["contract_status"] | null
          template_id?: string | null
          tenant_id: string
          terms_and_conditions?: string | null
          title: string
          total_value?: number | null
          updated_at?: string | null
        }
        Update: {
          approval_status?:
            | Database["public"]["Enums"]["approval_status"]
            | null
          approved_at?: string | null
          approved_by?: string | null
          auto_renewal?: boolean | null
          client_id?: string
          client_signature_data?: Json | null
          client_signature_status?: string | null
          client_signed_at?: string | null
          content?: string | null
          contract_number?: string
          contract_type?: Database["public"]["Enums"]["contract_type"]
          created_at?: string | null
          created_by?: string | null
          currency?: Database["public"]["Enums"]["currency_code"] | null
          custom_clauses?: Json | null
          description?: string | null
          end_date?: string | null
          id?: string
          payment_terms?: Database["public"]["Enums"]["payment_terms"] | null
          pricing_rule_id?: string | null
          provider_signature_data?: Json | null
          provider_signature_status?: string | null
          provider_signed_at?: string | null
          rejection_reason?: string | null
          renewal_date?: string | null
          renewal_period_months?: number | null
          start_date?: string
          status?: Database["public"]["Enums"]["contract_status"] | null
          template_id?: string | null
          tenant_id?: string
          terms_and_conditions?: string | null
          title?: string
          total_value?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_pricing_rule_id_fkey"
            columns: ["pricing_rule_id"]
            isOneToOne: false
            referencedRelation: "pricing_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "contract_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_notes: {
        Row: {
          amount: number
          applied_at: string | null
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
          created_at: string
          created_by: string | null
          credit_note_number: string
          currency: string
          description: string | null
          id: string
          invoice_id: string
          issue_date: string
          reason: string
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          applied_at?: string | null
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          credit_note_number: string
          currency?: string
          description?: string | null
          id?: string
          invoice_id: string
          issue_date: string
          reason: string
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          applied_at?: string | null
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          credit_note_number?: string
          currency?: string
          description?: string | null
          id?: string
          invoice_id?: string
          issue_date?: string
          reason?: string
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_notes_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      data_export_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          completed_at: string | null
          created_at: string | null
          date_range: Json | null
          download_count: number | null
          download_url: string | null
          error_details: Json | null
          error_message: string | null
          estimated_completion: string | null
          expires_at: string | null
          export_format: string | null
          export_type: string
          file_path: string | null
          file_size: number | null
          filters: Json | null
          id: string
          include_sensitive_data: boolean | null
          processing_started_at: string | null
          progress_percentage: number | null
          requested_by: string
          status: Database["public"]["Enums"]["data_export_status"] | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          completed_at?: string | null
          created_at?: string | null
          date_range?: Json | null
          download_count?: number | null
          download_url?: string | null
          error_details?: Json | null
          error_message?: string | null
          estimated_completion?: string | null
          expires_at?: string | null
          export_format?: string | null
          export_type: string
          file_path?: string | null
          file_size?: number | null
          filters?: Json | null
          id?: string
          include_sensitive_data?: boolean | null
          processing_started_at?: string | null
          progress_percentage?: number | null
          requested_by: string
          status?: Database["public"]["Enums"]["data_export_status"] | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          completed_at?: string | null
          created_at?: string | null
          date_range?: Json | null
          download_count?: number | null
          download_url?: string | null
          error_details?: Json | null
          error_message?: string | null
          estimated_completion?: string | null
          expires_at?: string | null
          export_format?: string | null
          export_type?: string
          file_path?: string | null
          file_size?: number | null
          filters?: Json | null
          id?: string
          include_sensitive_data?: boolean | null
          processing_started_at?: string | null
          progress_percentage?: number | null
          requested_by?: string
          status?: Database["public"]["Enums"]["data_export_status"] | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "data_export_requests_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_export_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_export_requests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      data_mapping_templates: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          duplicate_detection_rules: Json | null
          entity_type: string
          field_mappings: Json
          id: string
          is_active: boolean | null
          is_default: boolean | null
          merge_strategies: Json | null
          name: string
          provider_id: string | null
          tenant_id: string
          transformation_rules: Json | null
          updated_at: string | null
          validation_rules: Json | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          duplicate_detection_rules?: Json | null
          entity_type: string
          field_mappings?: Json
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          merge_strategies?: Json | null
          name: string
          provider_id?: string | null
          tenant_id: string
          transformation_rules?: Json | null
          updated_at?: string | null
          validation_rules?: Json | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          duplicate_detection_rules?: Json | null
          entity_type?: string
          field_mappings?: Json
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          merge_strategies?: Json | null
          name?: string
          provider_id?: string | null
          tenant_id?: string
          transformation_rules?: Json | null
          updated_at?: string | null
          validation_rules?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "data_mapping_templates_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "integration_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      data_quality_metrics: {
        Row: {
          checked_at: string
          column_name: string | null
          created_at: string
          details: Json | null
          error_count: number | null
          id: string
          is_passing: boolean | null
          metric_type: string
          metric_value: number
          sample_size: number | null
          table_name: string
          tenant_id: string
          threshold_value: number | null
        }
        Insert: {
          checked_at?: string
          column_name?: string | null
          created_at?: string
          details?: Json | null
          error_count?: number | null
          id?: string
          is_passing?: boolean | null
          metric_type: string
          metric_value: number
          sample_size?: number | null
          table_name: string
          tenant_id: string
          threshold_value?: number | null
        }
        Update: {
          checked_at?: string
          column_name?: string | null
          created_at?: string
          details?: Json | null
          error_count?: number | null
          id?: string
          is_passing?: boolean | null
          metric_type?: string
          metric_value?: number
          sample_size?: number | null
          table_name?: string
          tenant_id?: string
          threshold_value?: number | null
        }
        Relationships: []
      }
      device_sessions: {
        Row: {
          battery_level: number | null
          created_at: string
          data_usage_mb: number | null
          device_id: string
          id: string
          is_active: boolean | null
          last_sync_at: string | null
          location_last_known: Json | null
          offline_data_size: number | null
          session_token: string
          technician_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          battery_level?: number | null
          created_at?: string
          data_usage_mb?: number | null
          device_id: string
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          location_last_known?: Json | null
          offline_data_size?: number | null
          session_token: string
          technician_id: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          battery_level?: number | null
          created_at?: string
          data_usage_mb?: number | null
          device_id?: string
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          location_last_known?: Json | null
          offline_data_size?: number | null
          session_token?: string
          technician_id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_analytics: {
        Row: {
          browser: string | null
          campaign_id: string | null
          created_at: string | null
          device_type: string | null
          event_data: Json | null
          event_timestamp: string | null
          event_type: string
          id: string
          ip_address: unknown | null
          location_city: string | null
          location_country: string | null
          operating_system: string | null
          recipient_id: string | null
          send_id: string | null
          tenant_id: string
          url: string | null
          url_title: string | null
          user_agent: string | null
        }
        Insert: {
          browser?: string | null
          campaign_id?: string | null
          created_at?: string | null
          device_type?: string | null
          event_data?: Json | null
          event_timestamp?: string | null
          event_type: string
          id?: string
          ip_address?: unknown | null
          location_city?: string | null
          location_country?: string | null
          operating_system?: string | null
          recipient_id?: string | null
          send_id?: string | null
          tenant_id: string
          url?: string | null
          url_title?: string | null
          user_agent?: string | null
        }
        Update: {
          browser?: string | null
          campaign_id?: string | null
          created_at?: string | null
          device_type?: string | null
          event_data?: Json | null
          event_timestamp?: string | null
          event_type?: string
          id?: string
          ip_address?: unknown | null
          location_city?: string | null
          location_country?: string | null
          operating_system?: string | null
          recipient_id?: string | null
          send_id?: string | null
          tenant_id?: string
          url?: string | null
          url_title?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_analytics_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_analytics_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "email_recipients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_analytics_send_id_fkey"
            columns: ["send_id"]
            isOneToOne: false
            referencedRelation: "email_sends"
            referencedColumns: ["id"]
          },
        ]
      }
      email_attachments: {
        Row: {
          content_id: string | null
          created_at: string | null
          file_path: string | null
          file_size: number | null
          filename: string
          id: string
          is_inline: boolean | null
          is_valid: boolean | null
          mime_type: string | null
          original_filename: string | null
          template_id: string | null
          tenant_id: string
          updated_at: string | null
          usage_count: number | null
          validation_errors: Json | null
          virus_scan_result: Json | null
          virus_scan_status: string | null
        }
        Insert: {
          content_id?: string | null
          created_at?: string | null
          file_path?: string | null
          file_size?: number | null
          filename: string
          id?: string
          is_inline?: boolean | null
          is_valid?: boolean | null
          mime_type?: string | null
          original_filename?: string | null
          template_id?: string | null
          tenant_id: string
          updated_at?: string | null
          usage_count?: number | null
          validation_errors?: Json | null
          virus_scan_result?: Json | null
          virus_scan_status?: string | null
        }
        Update: {
          content_id?: string | null
          created_at?: string | null
          file_path?: string | null
          file_size?: number | null
          filename?: string
          id?: string
          is_inline?: boolean | null
          is_valid?: boolean | null
          mime_type?: string | null
          original_filename?: string | null
          template_id?: string | null
          tenant_id?: string
          updated_at?: string | null
          usage_count?: number | null
          validation_errors?: Json | null
          virus_scan_result?: Json | null
          virus_scan_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_attachments_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      email_bounces: {
        Row: {
          bounce_code: string | null
          bounce_reason: string | null
          bounce_subtype: string | null
          bounce_timestamp: string | null
          bounce_type: string
          created_at: string | null
          id: string
          is_permanent: boolean | null
          recipient_id: string | null
          resolution_notes: string | null
          resolution_status: string | null
          resolved_at: string | null
          resolved_by: string | null
          send_id: string | null
          severity_level: number | null
          should_retry: boolean | null
          smtp_response: string | null
          tenant_id: string
        }
        Insert: {
          bounce_code?: string | null
          bounce_reason?: string | null
          bounce_subtype?: string | null
          bounce_timestamp?: string | null
          bounce_type: string
          created_at?: string | null
          id?: string
          is_permanent?: boolean | null
          recipient_id?: string | null
          resolution_notes?: string | null
          resolution_status?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          send_id?: string | null
          severity_level?: number | null
          should_retry?: boolean | null
          smtp_response?: string | null
          tenant_id: string
        }
        Update: {
          bounce_code?: string | null
          bounce_reason?: string | null
          bounce_subtype?: string | null
          bounce_timestamp?: string | null
          bounce_type?: string
          created_at?: string | null
          id?: string
          is_permanent?: boolean | null
          recipient_id?: string | null
          resolution_notes?: string | null
          resolution_status?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          send_id?: string | null
          severity_level?: number | null
          should_retry?: boolean | null
          smtp_response?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_bounces_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "email_recipients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_bounces_send_id_fkey"
            columns: ["send_id"]
            isOneToOne: false
            referencedRelation: "email_sends"
            referencedColumns: ["id"]
          },
        ]
      }
      email_campaigns: {
        Row: {
          ab_test_config: Json | null
          ab_test_winner: string | null
          campaign_type: string | null
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          delivery_settings: Json | null
          description: string | null
          id: string
          max_retries: number | null
          name: string
          rate_limit_per_hour: number | null
          recipient_count: number | null
          recipient_criteria: Json | null
          retry_count: number | null
          scheduled_at: string | null
          send_errors: Json | null
          send_immediately: boolean | null
          send_optimization: Json | null
          sender_config: Json | null
          started_at: string | null
          status: string | null
          template_id: string | null
          tenant_id: string
          timezone: string | null
          total_bounced: number | null
          total_clicked: number | null
          total_delivered: number | null
          total_opened: number | null
          total_sent: number | null
          total_unsubscribed: number | null
          updated_at: string | null
        }
        Insert: {
          ab_test_config?: Json | null
          ab_test_winner?: string | null
          campaign_type?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          delivery_settings?: Json | null
          description?: string | null
          id?: string
          max_retries?: number | null
          name: string
          rate_limit_per_hour?: number | null
          recipient_count?: number | null
          recipient_criteria?: Json | null
          retry_count?: number | null
          scheduled_at?: string | null
          send_errors?: Json | null
          send_immediately?: boolean | null
          send_optimization?: Json | null
          sender_config?: Json | null
          started_at?: string | null
          status?: string | null
          template_id?: string | null
          tenant_id: string
          timezone?: string | null
          total_bounced?: number | null
          total_clicked?: number | null
          total_delivered?: number | null
          total_opened?: number | null
          total_sent?: number | null
          total_unsubscribed?: number | null
          updated_at?: string | null
        }
        Update: {
          ab_test_config?: Json | null
          ab_test_winner?: string | null
          campaign_type?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          delivery_settings?: Json | null
          description?: string | null
          id?: string
          max_retries?: number | null
          name?: string
          rate_limit_per_hour?: number | null
          recipient_count?: number | null
          recipient_criteria?: Json | null
          retry_count?: number | null
          scheduled_at?: string | null
          send_errors?: Json | null
          send_immediately?: boolean | null
          send_optimization?: Json | null
          sender_config?: Json | null
          started_at?: string | null
          status?: string | null
          template_id?: string | null
          tenant_id?: string
          timezone?: string | null
          total_bounced?: number | null
          total_clicked?: number | null
          total_delivered?: number | null
          total_opened?: number | null
          total_sent?: number | null
          total_unsubscribed?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_campaigns_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      email_configuration: {
        Row: {
          api_key_id: string | null
          bounce_webhook_url: string | null
          complaint_webhook_url: string | null
          created_at: string | null
          daily_send_limit: number | null
          default_from_email: string | null
          default_from_name: string | null
          default_reply_to: string | null
          delivery_webhook_url: string | null
          enable_click_tracking: boolean | null
          enable_double_optin: boolean | null
          enable_open_tracking: boolean | null
          enable_unsubscribe_tracking: boolean | null
          hourly_send_limit: number | null
          id: string
          is_active: boolean | null
          monthly_send_limit: number | null
          privacy_policy_url: string | null
          sender_domains: string[] | null
          smtp_settings: Json | null
          tenant_id: string
          tracking_domain: string | null
          unsubscribe_footer_template: string | null
          updated_at: string | null
          verified_domains: string[] | null
        }
        Insert: {
          api_key_id?: string | null
          bounce_webhook_url?: string | null
          complaint_webhook_url?: string | null
          created_at?: string | null
          daily_send_limit?: number | null
          default_from_email?: string | null
          default_from_name?: string | null
          default_reply_to?: string | null
          delivery_webhook_url?: string | null
          enable_click_tracking?: boolean | null
          enable_double_optin?: boolean | null
          enable_open_tracking?: boolean | null
          enable_unsubscribe_tracking?: boolean | null
          hourly_send_limit?: number | null
          id?: string
          is_active?: boolean | null
          monthly_send_limit?: number | null
          privacy_policy_url?: string | null
          sender_domains?: string[] | null
          smtp_settings?: Json | null
          tenant_id: string
          tracking_domain?: string | null
          unsubscribe_footer_template?: string | null
          updated_at?: string | null
          verified_domains?: string[] | null
        }
        Update: {
          api_key_id?: string | null
          bounce_webhook_url?: string | null
          complaint_webhook_url?: string | null
          created_at?: string | null
          daily_send_limit?: number | null
          default_from_email?: string | null
          default_from_name?: string | null
          default_reply_to?: string | null
          delivery_webhook_url?: string | null
          enable_click_tracking?: boolean | null
          enable_double_optin?: boolean | null
          enable_open_tracking?: boolean | null
          enable_unsubscribe_tracking?: boolean | null
          hourly_send_limit?: number | null
          id?: string
          is_active?: boolean | null
          monthly_send_limit?: number | null
          privacy_policy_url?: string | null
          sender_domains?: string[] | null
          smtp_settings?: Json | null
          tenant_id?: string
          tracking_domain?: string | null
          unsubscribe_footer_template?: string | null
          updated_at?: string | null
          verified_domains?: string[] | null
        }
        Relationships: []
      }
      email_recipients: {
        Row: {
          created_at: string | null
          email: string
          email_validation_status: string | null
          email_verified: boolean | null
          first_name: string | null
          id: string
          last_clicked_at: string | null
          last_name: string | null
          last_opened_at: string | null
          merge_fields: Json | null
          preferences: Json | null
          source: string | null
          status: string | null
          tags: string[] | null
          tenant_id: string
          total_clicks: number | null
          total_opens: number | null
          total_sends: number | null
          updated_at: string | null
          validation_errors: Json | null
        }
        Insert: {
          created_at?: string | null
          email: string
          email_validation_status?: string | null
          email_verified?: boolean | null
          first_name?: string | null
          id?: string
          last_clicked_at?: string | null
          last_name?: string | null
          last_opened_at?: string | null
          merge_fields?: Json | null
          preferences?: Json | null
          source?: string | null
          status?: string | null
          tags?: string[] | null
          tenant_id: string
          total_clicks?: number | null
          total_opens?: number | null
          total_sends?: number | null
          updated_at?: string | null
          validation_errors?: Json | null
        }
        Update: {
          created_at?: string | null
          email?: string
          email_validation_status?: string | null
          email_verified?: boolean | null
          first_name?: string | null
          id?: string
          last_clicked_at?: string | null
          last_name?: string | null
          last_opened_at?: string | null
          merge_fields?: Json | null
          preferences?: Json | null
          source?: string | null
          status?: string | null
          tags?: string[] | null
          tenant_id?: string
          total_clicks?: number | null
          total_opens?: number | null
          total_sends?: number | null
          updated_at?: string | null
          validation_errors?: Json | null
        }
        Relationships: []
      }
      email_sends: {
        Row: {
          bounce_reason: string | null
          bounce_type: string | null
          bounced_at: string | null
          campaign_id: string | null
          click_count: number | null
          created_at: string | null
          delivered_at: string | null
          error_code: string | null
          error_details: Json | null
          error_message: string | null
          failed_at: string | null
          first_clicked_at: string | null
          from_email: string | null
          from_name: string | null
          id: string
          max_attempts: number | null
          message_id: string | null
          open_count: number | null
          opened_at: string | null
          queued_at: string | null
          recipient_id: string | null
          reply_to: string | null
          send_attempts: number | null
          sent_at: string | null
          smtp_message_id: string | null
          status: string | null
          subject: string | null
          template_id: string | null
          tenant_id: string
          tracking_pixel_url: string | null
          updated_at: string | null
        }
        Insert: {
          bounce_reason?: string | null
          bounce_type?: string | null
          bounced_at?: string | null
          campaign_id?: string | null
          click_count?: number | null
          created_at?: string | null
          delivered_at?: string | null
          error_code?: string | null
          error_details?: Json | null
          error_message?: string | null
          failed_at?: string | null
          first_clicked_at?: string | null
          from_email?: string | null
          from_name?: string | null
          id?: string
          max_attempts?: number | null
          message_id?: string | null
          open_count?: number | null
          opened_at?: string | null
          queued_at?: string | null
          recipient_id?: string | null
          reply_to?: string | null
          send_attempts?: number | null
          sent_at?: string | null
          smtp_message_id?: string | null
          status?: string | null
          subject?: string | null
          template_id?: string | null
          tenant_id: string
          tracking_pixel_url?: string | null
          updated_at?: string | null
        }
        Update: {
          bounce_reason?: string | null
          bounce_type?: string | null
          bounced_at?: string | null
          campaign_id?: string | null
          click_count?: number | null
          created_at?: string | null
          delivered_at?: string | null
          error_code?: string | null
          error_details?: Json | null
          error_message?: string | null
          failed_at?: string | null
          first_clicked_at?: string | null
          from_email?: string | null
          from_name?: string | null
          id?: string
          max_attempts?: number | null
          message_id?: string | null
          open_count?: number | null
          opened_at?: string | null
          queued_at?: string | null
          recipient_id?: string | null
          reply_to?: string | null
          send_attempts?: number | null
          sent_at?: string | null
          smtp_message_id?: string | null
          status?: string | null
          subject?: string | null
          template_id?: string | null
          tenant_id?: string
          tracking_pixel_url?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_sends_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_sends_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "email_recipients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_sends_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          category: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          html_template: string | null
          id: string
          is_system_template: boolean | null
          name: string
          reply_to: string | null
          sender_email: string | null
          sender_name: string | null
          status: string | null
          subject_template: string
          template_variables: Json | null
          tenant_id: string
          text_template: string | null
          updated_at: string | null
          validation_errors: Json | null
          validation_rules: Json | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          html_template?: string | null
          id?: string
          is_system_template?: boolean | null
          name: string
          reply_to?: string | null
          sender_email?: string | null
          sender_name?: string | null
          status?: string | null
          subject_template: string
          template_variables?: Json | null
          tenant_id: string
          text_template?: string | null
          updated_at?: string | null
          validation_errors?: Json | null
          validation_rules?: Json | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          html_template?: string | null
          id?: string
          is_system_template?: boolean | null
          name?: string
          reply_to?: string | null
          sender_email?: string | null
          sender_name?: string | null
          status?: string | null
          subject_template?: string
          template_variables?: Json | null
          tenant_id?: string
          text_template?: string | null
          updated_at?: string | null
          validation_errors?: Json | null
          validation_rules?: Json | null
        }
        Relationships: []
      }
      email_unsubscribes: {
        Row: {
          campaign_id: string | null
          compliance_method: string | null
          confirmation_sent: boolean | null
          created_at: string | null
          id: string
          ip_address: unknown | null
          recipient_id: string | null
          tenant_id: string
          unsubscribe_method: string | null
          unsubscribe_reason: string | null
          unsubscribe_type: string | null
          unsubscribed_at: string | null
          user_agent: string | null
        }
        Insert: {
          campaign_id?: string | null
          compliance_method?: string | null
          confirmation_sent?: boolean | null
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          recipient_id?: string | null
          tenant_id: string
          unsubscribe_method?: string | null
          unsubscribe_reason?: string | null
          unsubscribe_type?: string | null
          unsubscribed_at?: string | null
          user_agent?: string | null
        }
        Update: {
          campaign_id?: string | null
          compliance_method?: string | null
          confirmation_sent?: boolean | null
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          recipient_id?: string | null
          tenant_id?: string
          unsubscribe_method?: string | null
          unsubscribe_reason?: string | null
          unsubscribe_type?: string | null
          unsubscribed_at?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_unsubscribes_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_unsubscribes_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "email_recipients"
            referencedColumns: ["id"]
          },
        ]
      }
      error_logs: {
        Row: {
          context: Json | null
          created_at: string
          environment: string
          error_message: string
          error_stack: string | null
          error_type: string
          id: string
          tenant_id: string | null
          url: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          context?: Json | null
          created_at?: string
          environment?: string
          error_message: string
          error_stack?: string | null
          error_type: string
          id?: string
          tenant_id?: string | null
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          context?: Json | null
          created_at?: string
          environment?: string
          error_message?: string
          error_stack?: string | null
          error_type?: string
          id?: string
          tenant_id?: string | null
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "error_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "error_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      field_messages: {
        Row: {
          content: string | null
          created_at: string
          delivery_status: string | null
          file_path: string | null
          id: string
          location_data: Json | null
          message_type: string
          priority: string | null
          read_at: string | null
          recipient_id: string | null
          sender_id: string
          sync_status: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          delivery_status?: string | null
          file_path?: string | null
          id?: string
          location_data?: Json | null
          message_type: string
          priority?: string | null
          read_at?: string | null
          recipient_id?: string | null
          sender_id: string
          sync_status?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          delivery_status?: string | null
          file_path?: string | null
          id?: string
          location_data?: Json | null
          message_type?: string
          priority?: string | null
          read_at?: string | null
          recipient_id?: string | null
          sender_id?: string
          sync_status?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      field_service_photos: {
        Row: {
          caption: string | null
          compressed_file_path: string | null
          compressed_file_size: number | null
          created_at: string
          file_path: string | null
          file_size: number | null
          id: string
          local_id: string | null
          location_coordinates: Json | null
          offline_created_at: string | null
          photo_type: string
          sync_status: string | null
          technician_id: string
          tenant_id: string
          updated_at: string
          work_order_id: string | null
        }
        Insert: {
          caption?: string | null
          compressed_file_path?: string | null
          compressed_file_size?: number | null
          created_at?: string
          file_path?: string | null
          file_size?: number | null
          id?: string
          local_id?: string | null
          location_coordinates?: Json | null
          offline_created_at?: string | null
          photo_type: string
          sync_status?: string | null
          technician_id: string
          tenant_id: string
          updated_at?: string
          work_order_id?: string | null
        }
        Update: {
          caption?: string | null
          compressed_file_path?: string | null
          compressed_file_size?: number | null
          created_at?: string
          file_path?: string | null
          file_size?: number | null
          id?: string
          local_id?: string | null
          location_coordinates?: Json | null
          offline_created_at?: string | null
          photo_type?: string
          sync_status?: string | null
          technician_id?: string
          tenant_id?: string
          updated_at?: string
          work_order_id?: string | null
        }
        Relationships: []
      }
      file_uploads: {
        Row: {
          access_permissions: Json | null
          created_at: string | null
          download_count: number | null
          expires_at: string | null
          file_hash: string
          file_path: string
          file_size: number
          filename: string
          id: string
          is_public: boolean | null
          max_downloads: number | null
          mime_type: string
          original_filename: string
          related_entity_id: string | null
          related_entity_type: string | null
          scan_completed_at: string | null
          scan_result: Json | null
          scan_started_at: string | null
          scan_status: Database["public"]["Enums"]["file_scan_status"] | null
          tenant_id: string
          updated_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          access_permissions?: Json | null
          created_at?: string | null
          download_count?: number | null
          expires_at?: string | null
          file_hash: string
          file_path: string
          file_size: number
          filename: string
          id?: string
          is_public?: boolean | null
          max_downloads?: number | null
          mime_type: string
          original_filename: string
          related_entity_id?: string | null
          related_entity_type?: string | null
          scan_completed_at?: string | null
          scan_result?: Json | null
          scan_started_at?: string | null
          scan_status?: Database["public"]["Enums"]["file_scan_status"] | null
          tenant_id: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          access_permissions?: Json | null
          created_at?: string | null
          download_count?: number | null
          expires_at?: string | null
          file_hash?: string
          file_path?: string
          file_size?: number
          filename?: string
          id?: string
          is_public?: boolean | null
          max_downloads?: number | null
          mime_type?: string
          original_filename?: string
          related_entity_id?: string | null
          related_entity_type?: string | null
          scan_completed_at?: string | null
          scan_result?: Json | null
          scan_started_at?: string | null
          scan_status?: Database["public"]["Enums"]["file_scan_status"] | null
          tenant_id?: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "file_uploads_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "file_uploads_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_accounts: {
        Row: {
          account_code: string
          account_name: string
          account_type: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          parent_account_id: string | null
          tax_rate: number | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          account_code: string
          account_name: string
          account_type: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          parent_account_id?: string | null
          tax_rate?: number | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          account_code?: string
          account_name?: string
          account_type?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          parent_account_id?: string | null
          tax_rate?: number | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_accounts_parent_account_id_fkey"
            columns: ["parent_account_id"]
            isOneToOne: false
            referencedRelation: "financial_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_anomalies: {
        Row: {
          anomaly_type: string
          auto_resolved: boolean | null
          confidence_score: number | null
          created_at: string
          description: string
          detected_value: number | null
          expected_range_max: number | null
          expected_range_min: number | null
          id: string
          investigated_at: string | null
          investigated_by: string | null
          related_invoice_id: string | null
          related_transaction_id: string | null
          resolution_notes: string | null
          severity: string
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          anomaly_type: string
          auto_resolved?: boolean | null
          confidence_score?: number | null
          created_at?: string
          description: string
          detected_value?: number | null
          expected_range_max?: number | null
          expected_range_min?: number | null
          id?: string
          investigated_at?: string | null
          investigated_by?: string | null
          related_invoice_id?: string | null
          related_transaction_id?: string | null
          resolution_notes?: string | null
          severity: string
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          anomaly_type?: string
          auto_resolved?: boolean | null
          confidence_score?: number | null
          created_at?: string
          description?: string
          detected_value?: number | null
          expected_range_max?: number | null
          expected_range_min?: number | null
          id?: string
          investigated_at?: string | null
          investigated_by?: string | null
          related_invoice_id?: string | null
          related_transaction_id?: string | null
          resolution_notes?: string | null
          severity?: string
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_anomalies_related_invoice_id_fkey"
            columns: ["related_invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_anomalies_related_transaction_id_fkey"
            columns: ["related_transaction_id"]
            isOneToOne: false
            referencedRelation: "financial_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_audit_log: {
        Row: {
          action: string
          compliance_flags: Json | null
          created_at: string
          id: string
          ip_address: unknown | null
          new_values: Json | null
          old_values: Json | null
          record_id: string
          risk_level: string | null
          session_id: string | null
          table_name: string
          tenant_id: string
          user_agent: string | null
          user_id: string | null
          user_role: string | null
        }
        Insert: {
          action: string
          compliance_flags?: Json | null
          created_at?: string
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id: string
          risk_level?: string | null
          session_id?: string | null
          table_name: string
          tenant_id: string
          user_agent?: string | null
          user_id?: string | null
          user_role?: string | null
        }
        Update: {
          action?: string
          compliance_flags?: Json | null
          created_at?: string
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string
          risk_level?: string | null
          session_id?: string | null
          table_name?: string
          tenant_id?: string
          user_agent?: string | null
          user_id?: string | null
          user_role?: string | null
        }
        Relationships: []
      }
      financial_reports: {
        Row: {
          created_at: string
          data_validation_errors: Json | null
          expires_at: string | null
          file_format: string | null
          file_path: string | null
          generated_by: string | null
          generation_status: string
          id: string
          parameters: Json | null
          period_end: string
          period_start: string
          report_data: Json
          report_name: string
          report_type: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_validation_errors?: Json | null
          expires_at?: string | null
          file_format?: string | null
          file_path?: string | null
          generated_by?: string | null
          generation_status?: string
          id?: string
          parameters?: Json | null
          period_end: string
          period_start: string
          report_data?: Json
          report_name: string
          report_type: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_validation_errors?: Json | null
          expires_at?: string | null
          file_format?: string | null
          file_path?: string | null
          generated_by?: string | null
          generation_status?: string
          id?: string
          parameters?: Json | null
          period_end?: string
          period_start?: string
          report_data?: Json
          report_name?: string
          report_type?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      financial_transactions: {
        Row: {
          created_at: string
          created_by: string | null
          currency: string
          description: string
          id: string
          reference_id: string | null
          reference_type: string | null
          reversal_transaction_id: string | null
          status: string
          tenant_id: string
          total_amount: number
          transaction_date: string
          transaction_number: string
          transaction_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          currency?: string
          description: string
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          reversal_transaction_id?: string | null
          status?: string
          tenant_id: string
          total_amount: number
          transaction_date: string
          transaction_number: string
          transaction_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          reversal_transaction_id?: string | null
          status?: string
          tenant_id?: string
          total_amount?: number
          transaction_date?: string
          transaction_number?: string
          transaction_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_transactions_reversal_transaction_id_fkey"
            columns: ["reversal_transaction_id"]
            isOneToOne: false
            referencedRelation: "financial_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      help_articles: {
        Row: {
          category: string
          content: string
          content_hash: string | null
          created_at: string | null
          created_by: string | null
          excerpt: string | null
          helpful_votes: number | null
          id: string
          is_featured: boolean | null
          is_published: boolean | null
          meta_description: string | null
          meta_title: string | null
          not_helpful_votes: number | null
          previous_version_id: string | null
          published_at: string | null
          published_by: string | null
          required_permissions: string[] | null
          slug: string
          subcategory: string | null
          tags: string[] | null
          tenant_id: string
          title: string
          updated_at: string | null
          updated_by: string | null
          version: number | null
          view_count: number | null
          visibility_level: string | null
        }
        Insert: {
          category: string
          content: string
          content_hash?: string | null
          created_at?: string | null
          created_by?: string | null
          excerpt?: string | null
          helpful_votes?: number | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          not_helpful_votes?: number | null
          previous_version_id?: string | null
          published_at?: string | null
          published_by?: string | null
          required_permissions?: string[] | null
          slug: string
          subcategory?: string | null
          tags?: string[] | null
          tenant_id: string
          title: string
          updated_at?: string | null
          updated_by?: string | null
          version?: number | null
          view_count?: number | null
          visibility_level?: string | null
        }
        Update: {
          category?: string
          content?: string
          content_hash?: string | null
          created_at?: string | null
          created_by?: string | null
          excerpt?: string | null
          helpful_votes?: number | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          not_helpful_votes?: number | null
          previous_version_id?: string | null
          published_at?: string | null
          published_by?: string | null
          required_permissions?: string[] | null
          slug?: string
          subcategory?: string | null
          tags?: string[] | null
          tenant_id?: string
          title?: string
          updated_at?: string | null
          updated_by?: string | null
          version?: number | null
          view_count?: number | null
          visibility_level?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "help_articles_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "help_articles_previous_version_id_fkey"
            columns: ["previous_version_id"]
            isOneToOne: false
            referencedRelation: "help_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "help_articles_published_by_fkey"
            columns: ["published_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "help_articles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "help_articles_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          affected_records: number | null
          alert_type: string
          connection_id: string | null
          context_data: Json | null
          created_at: string | null
          id: string
          message: string
          notification_channels: Json | null
          notification_sent: boolean | null
          resolved_at: string | null
          severity: string | null
          status: string | null
          tenant_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          affected_records?: number | null
          alert_type: string
          connection_id?: string | null
          context_data?: Json | null
          created_at?: string | null
          id?: string
          message: string
          notification_channels?: Json | null
          notification_sent?: boolean | null
          resolved_at?: string | null
          severity?: string | null
          status?: string | null
          tenant_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          affected_records?: number | null
          alert_type?: string
          connection_id?: string | null
          context_data?: Json | null
          created_at?: string | null
          id?: string
          message?: string
          notification_channels?: Json | null
          notification_sent?: boolean | null
          resolved_at?: string | null
          severity?: string | null
          status?: string | null
          tenant_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integration_alerts_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "integration_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_connections: {
        Row: {
          auth_status: string | null
          connection_status: string | null
          consecutive_failures: number | null
          created_at: string | null
          created_by: string | null
          credentials: Json | null
          description: string | null
          error_count: number | null
          error_threshold: number | null
          field_mappings: Json | null
          health_check_errors: Json | null
          id: string
          last_error: Json | null
          last_health_check: string | null
          last_sync_at: string | null
          name: string
          next_sync_at: string | null
          oauth_state: string | null
          provider_id: string | null
          sync_enabled: boolean | null
          sync_frequency: string | null
          sync_settings: Json | null
          sync_status: string | null
          tenant_id: string
          token_expires_at: string | null
          updated_at: string | null
        }
        Insert: {
          auth_status?: string | null
          connection_status?: string | null
          consecutive_failures?: number | null
          created_at?: string | null
          created_by?: string | null
          credentials?: Json | null
          description?: string | null
          error_count?: number | null
          error_threshold?: number | null
          field_mappings?: Json | null
          health_check_errors?: Json | null
          id?: string
          last_error?: Json | null
          last_health_check?: string | null
          last_sync_at?: string | null
          name: string
          next_sync_at?: string | null
          oauth_state?: string | null
          provider_id?: string | null
          sync_enabled?: boolean | null
          sync_frequency?: string | null
          sync_settings?: Json | null
          sync_status?: string | null
          tenant_id: string
          token_expires_at?: string | null
          updated_at?: string | null
        }
        Update: {
          auth_status?: string | null
          connection_status?: string | null
          consecutive_failures?: number | null
          created_at?: string | null
          created_by?: string | null
          credentials?: Json | null
          description?: string | null
          error_count?: number | null
          error_threshold?: number | null
          field_mappings?: Json | null
          health_check_errors?: Json | null
          id?: string
          last_error?: Json | null
          last_health_check?: string | null
          last_sync_at?: string | null
          name?: string
          next_sync_at?: string | null
          oauth_state?: string | null
          provider_id?: string | null
          sync_enabled?: boolean | null
          sync_frequency?: string | null
          sync_settings?: Json | null
          sync_status?: string | null
          tenant_id?: string
          token_expires_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integration_connections_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "integration_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_providers: {
        Row: {
          api_config: Json | null
          auth_type: string
          base_url: string | null
          created_at: string | null
          deprecated_at: string | null
          description: string | null
          id: string
          name: string
          oauth_config: Json | null
          provider_type: string
          rate_limits: Json | null
          retry_config: Json | null
          status: string | null
          tenant_id: string
          timeout_seconds: number | null
          updated_at: string | null
          version: string | null
          webhook_config: Json | null
        }
        Insert: {
          api_config?: Json | null
          auth_type: string
          base_url?: string | null
          created_at?: string | null
          deprecated_at?: string | null
          description?: string | null
          id?: string
          name: string
          oauth_config?: Json | null
          provider_type: string
          rate_limits?: Json | null
          retry_config?: Json | null
          status?: string | null
          tenant_id: string
          timeout_seconds?: number | null
          updated_at?: string | null
          version?: string | null
          webhook_config?: Json | null
        }
        Update: {
          api_config?: Json | null
          auth_type?: string
          base_url?: string | null
          created_at?: string | null
          deprecated_at?: string | null
          description?: string | null
          id?: string
          name?: string
          oauth_config?: Json | null
          provider_type?: string
          rate_limits?: Json | null
          retry_config?: Json | null
          status?: string | null
          tenant_id?: string
          timeout_seconds?: number | null
          updated_at?: string | null
          version?: string | null
          webhook_config?: Json | null
        }
        Relationships: []
      }
      integration_sync_jobs: {
        Row: {
          completed_at: string | null
          conflict_resolution: Json | null
          connection_id: string | null
          created_at: string | null
          created_by: string | null
          error_details: Json | null
          estimated_completion: string | null
          failed_records: number | null
          id: string
          job_type: string
          max_retries: number | null
          next_retry_at: string | null
          priority: number | null
          processed_records: number | null
          progress_percentage: number | null
          queued_at: string | null
          retry_count: number | null
          started_at: string | null
          status: string | null
          successful_records: number | null
          sync_direction: string | null
          sync_results: Json | null
          tenant_id: string
          total_records: number | null
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          conflict_resolution?: Json | null
          connection_id?: string | null
          created_at?: string | null
          created_by?: string | null
          error_details?: Json | null
          estimated_completion?: string | null
          failed_records?: number | null
          id?: string
          job_type: string
          max_retries?: number | null
          next_retry_at?: string | null
          priority?: number | null
          processed_records?: number | null
          progress_percentage?: number | null
          queued_at?: string | null
          retry_count?: number | null
          started_at?: string | null
          status?: string | null
          successful_records?: number | null
          sync_direction?: string | null
          sync_results?: Json | null
          tenant_id: string
          total_records?: number | null
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          conflict_resolution?: Json | null
          connection_id?: string | null
          created_at?: string | null
          created_by?: string | null
          error_details?: Json | null
          estimated_completion?: string | null
          failed_records?: number | null
          id?: string
          job_type?: string
          max_retries?: number | null
          next_retry_at?: string | null
          priority?: number | null
          processed_records?: number | null
          progress_percentage?: number | null
          queued_at?: string | null
          retry_count?: number | null
          started_at?: string | null
          status?: string | null
          successful_records?: number | null
          sync_direction?: string | null
          sync_results?: Json | null
          tenant_id?: string
          total_records?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integration_sync_jobs_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "integration_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_webhooks: {
        Row: {
          connection_id: string | null
          consecutive_failures: number | null
          created_at: string | null
          delivery_success_rate: number | null
          delivery_timeout: number | null
          endpoint_url: string
          event_filters: Json | null
          id: string
          is_active: boolean | null
          last_delivery_at: string | null
          retry_attempts: number | null
          retry_delays: Json | null
          signature_algorithm: string | null
          signature_header: string | null
          supported_events: Json | null
          tenant_id: string
          updated_at: string | null
          webhook_secret: string | null
        }
        Insert: {
          connection_id?: string | null
          consecutive_failures?: number | null
          created_at?: string | null
          delivery_success_rate?: number | null
          delivery_timeout?: number | null
          endpoint_url: string
          event_filters?: Json | null
          id?: string
          is_active?: boolean | null
          last_delivery_at?: string | null
          retry_attempts?: number | null
          retry_delays?: Json | null
          signature_algorithm?: string | null
          signature_header?: string | null
          supported_events?: Json | null
          tenant_id: string
          updated_at?: string | null
          webhook_secret?: string | null
        }
        Update: {
          connection_id?: string | null
          consecutive_failures?: number | null
          created_at?: string | null
          delivery_success_rate?: number | null
          delivery_timeout?: number | null
          endpoint_url?: string
          event_filters?: Json | null
          id?: string
          is_active?: boolean | null
          last_delivery_at?: string | null
          retry_attempts?: number | null
          retry_delays?: Json | null
          signature_algorithm?: string | null
          signature_header?: string | null
          supported_events?: Json | null
          tenant_id?: string
          updated_at?: string | null
          webhook_secret?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integration_webhooks_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "integration_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_line_items: {
        Row: {
          account_id: string | null
          created_at: string
          description: string
          id: string
          invoice_id: string
          line_total: number
          quantity: number
          sort_order: number | null
          tax_amount: number | null
          tax_rate: number | null
          tenant_id: string
          unit_price: number
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          created_at?: string
          description: string
          id?: string
          invoice_id: string
          line_total: number
          quantity?: number
          sort_order?: number | null
          tax_amount?: number | null
          tax_rate?: number | null
          tenant_id: string
          unit_price: number
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string
          line_total?: number
          quantity?: number
          sort_order?: number | null
          tax_amount?: number | null
          tax_rate?: number | null
          tenant_id?: string
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_line_items_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "financial_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_line_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          client_id: string
          created_at: string
          created_by: string | null
          currency: string
          discount_amount: number | null
          due_date: string
          id: string
          invoice_number: string
          issue_date: string
          last_reminder_sent: string | null
          notes: string | null
          payment_instructions: string | null
          payment_terms: string | null
          reminder_count: number | null
          status: string
          subtotal: number
          tax_amount: number
          tax_calculation_details: Json | null
          tenant_id: string
          terms_conditions: string | null
          total_amount: number
          updated_at: string
          validation_errors: Json | null
        }
        Insert: {
          client_id: string
          created_at?: string
          created_by?: string | null
          currency?: string
          discount_amount?: number | null
          due_date: string
          id?: string
          invoice_number: string
          issue_date: string
          last_reminder_sent?: string | null
          notes?: string | null
          payment_instructions?: string | null
          payment_terms?: string | null
          reminder_count?: number | null
          status?: string
          subtotal?: number
          tax_amount?: number
          tax_calculation_details?: Json | null
          tenant_id: string
          terms_conditions?: string | null
          total_amount?: number
          updated_at?: string
          validation_errors?: Json | null
        }
        Update: {
          client_id?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          discount_amount?: number | null
          due_date?: string
          id?: string
          invoice_number?: string
          issue_date?: string
          last_reminder_sent?: string | null
          notes?: string | null
          payment_instructions?: string | null
          payment_terms?: string | null
          reminder_count?: number | null
          status?: string
          subtotal?: number
          tax_amount?: number
          tax_calculation_details?: Json | null
          tenant_id?: string
          terms_conditions?: string | null
          total_amount?: number
          updated_at?: string
          validation_errors?: Json | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          attachments: Json | null
          bounce_details: Json | null
          bounce_reason: string | null
          content: string
          created_at: string | null
          delivered_at: string | null
          delivery_attempts: number | null
          delivery_errors: Json | null
          id: string
          message_type: string | null
          read_at: string | null
          read_receipt_requested: boolean | null
          recipient_id: string | null
          recipient_type: string | null
          related_entity_id: string | null
          related_entity_type: string | null
          sender_id: string | null
          sender_type: string | null
          status: Database["public"]["Enums"]["message_status"] | null
          subject: string | null
          tenant_id: string
          thread_id: string | null
          updated_at: string | null
        }
        Insert: {
          attachments?: Json | null
          bounce_details?: Json | null
          bounce_reason?: string | null
          content: string
          created_at?: string | null
          delivered_at?: string | null
          delivery_attempts?: number | null
          delivery_errors?: Json | null
          id?: string
          message_type?: string | null
          read_at?: string | null
          read_receipt_requested?: boolean | null
          recipient_id?: string | null
          recipient_type?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          sender_id?: string | null
          sender_type?: string | null
          status?: Database["public"]["Enums"]["message_status"] | null
          subject?: string | null
          tenant_id: string
          thread_id?: string | null
          updated_at?: string | null
        }
        Update: {
          attachments?: Json | null
          bounce_details?: Json | null
          bounce_reason?: string | null
          content?: string
          created_at?: string | null
          delivered_at?: string | null
          delivery_attempts?: number | null
          delivery_errors?: Json | null
          id?: string
          message_type?: string | null
          read_at?: string | null
          read_receipt_requested?: boolean | null
          recipient_id?: string | null
          recipient_type?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          sender_id?: string | null
          sender_type?: string | null
          status?: Database["public"]["Enums"]["message_status"] | null
          subject?: string | null
          tenant_id?: string
          thread_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      monitor_alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          alert_data: Json | null
          alert_level: string
          created_at: string
          id: string
          message: string
          monitor_id: string
          notification_attempts: number | null
          notification_sent: boolean | null
          resolution_notes: string | null
          resolved_at: string | null
          status: string
          tenant_id: string
          title: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_data?: Json | null
          alert_level: string
          created_at?: string
          id?: string
          message: string
          monitor_id: string
          notification_attempts?: number | null
          notification_sent?: boolean | null
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: string
          tenant_id: string
          title: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_data?: Json | null
          alert_level?: string
          created_at?: string
          id?: string
          message?: string
          monitor_id?: string
          notification_attempts?: number | null
          notification_sent?: boolean | null
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: string
          tenant_id?: string
          title?: string
        }
        Relationships: []
      }
      monitoring_errors: {
        Row: {
          affected_users: number | null
          api_endpoint: string | null
          assigned_to: string | null
          browser: string | null
          business_impact: string | null
          category: string | null
          city: string | null
          country: string | null
          created_at: string | null
          device_type: string | null
          error_code: string | null
          error_message: string
          error_stack: string | null
          error_type: string
          first_occurred_at: string | null
          id: string
          ip_address: unknown | null
          last_occurred_at: string | null
          occurrence_count: number | null
          os: string | null
          page_url: string | null
          resolution_notes: string | null
          resolution_time_minutes: number | null
          resolved_at: string | null
          session_id: string | null
          severity: string | null
          sla_breach: boolean | null
          sla_target_minutes: number | null
          status: string | null
          subcategory: string | null
          tenant_id: string
          updated_at: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          affected_users?: number | null
          api_endpoint?: string | null
          assigned_to?: string | null
          browser?: string | null
          business_impact?: string | null
          category?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          device_type?: string | null
          error_code?: string | null
          error_message: string
          error_stack?: string | null
          error_type: string
          first_occurred_at?: string | null
          id?: string
          ip_address?: unknown | null
          last_occurred_at?: string | null
          occurrence_count?: number | null
          os?: string | null
          page_url?: string | null
          resolution_notes?: string | null
          resolution_time_minutes?: number | null
          resolved_at?: string | null
          session_id?: string | null
          severity?: string | null
          sla_breach?: boolean | null
          sla_target_minutes?: number | null
          status?: string | null
          subcategory?: string | null
          tenant_id: string
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          affected_users?: number | null
          api_endpoint?: string | null
          assigned_to?: string | null
          browser?: string | null
          business_impact?: string | null
          category?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          device_type?: string | null
          error_code?: string | null
          error_message?: string
          error_stack?: string | null
          error_type?: string
          first_occurred_at?: string | null
          id?: string
          ip_address?: unknown | null
          last_occurred_at?: string | null
          occurrence_count?: number | null
          os?: string | null
          page_url?: string | null
          resolution_notes?: string | null
          resolution_time_minutes?: number | null
          resolved_at?: string | null
          session_id?: string | null
          severity?: string | null
          sla_breach?: boolean | null
          sla_target_minutes?: number | null
          status?: string | null
          subcategory?: string | null
          tenant_id?: string
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          booking_reminders: Json | null
          created_at: string | null
          email_enabled: boolean | null
          frequency_limits: Json | null
          id: string
          in_app_enabled: boolean | null
          promotional: Json | null
          push_enabled: boolean | null
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          sms_enabled: boolean | null
          system_alerts: Json | null
          tenant_id: string
          ticket_updates: Json | null
          timezone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          booking_reminders?: Json | null
          created_at?: string | null
          email_enabled?: boolean | null
          frequency_limits?: Json | null
          id?: string
          in_app_enabled?: boolean | null
          promotional?: Json | null
          push_enabled?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          sms_enabled?: boolean | null
          system_alerts?: Json | null
          tenant_id: string
          ticket_updates?: Json | null
          timezone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          booking_reminders?: Json | null
          created_at?: string | null
          email_enabled?: boolean | null
          frequency_limits?: Json | null
          id?: string
          in_app_enabled?: boolean | null
          promotional?: Json | null
          push_enabled?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          sms_enabled?: boolean | null
          system_alerts?: Json | null
          tenant_id?: string
          ticket_updates?: Json | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      parts_inventory: {
        Row: {
          barcode: string | null
          category: string | null
          created_at: string
          current_stock: number
          description: string | null
          id: string
          location: string | null
          manufacturer: string | null
          max_stock_level: number | null
          min_stock_level: number | null
          part_name: string
          part_number: string
          sync_status: string | null
          tenant_id: string
          unit_cost: number | null
          updated_at: string
        }
        Insert: {
          barcode?: string | null
          category?: string | null
          created_at?: string
          current_stock?: number
          description?: string | null
          id?: string
          location?: string | null
          manufacturer?: string | null
          max_stock_level?: number | null
          min_stock_level?: number | null
          part_name: string
          part_number: string
          sync_status?: string | null
          tenant_id: string
          unit_cost?: number | null
          updated_at?: string
        }
        Update: {
          barcode?: string | null
          category?: string | null
          created_at?: string
          current_stock?: number
          description?: string | null
          id?: string
          location?: string | null
          manufacturer?: string | null
          max_stock_level?: number | null
          min_stock_level?: number | null
          part_name?: string
          part_number?: string
          sync_status?: string | null
          tenant_id?: string
          unit_cost?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      payment_plan_installments: {
        Row: {
          amount: number
          created_at: string
          due_date: string
          id: string
          installment_number: number
          late_fee_applied: number | null
          paid_date: string | null
          payment_id: string | null
          payment_plan_id: string
          retry_count: number | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          due_date: string
          id?: string
          installment_number: number
          late_fee_applied?: number | null
          paid_date?: string | null
          payment_id?: string | null
          payment_plan_id: string
          retry_count?: number | null
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          due_date?: string
          id?: string
          installment_number?: number
          late_fee_applied?: number | null
          paid_date?: string | null
          payment_id?: string | null
          payment_plan_id?: string
          retry_count?: number | null
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_plan_installments_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_plan_installments_payment_plan_id_fkey"
            columns: ["payment_plan_id"]
            isOneToOne: false
            referencedRelation: "payment_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_plans: {
        Row: {
          auto_debit: boolean | null
          created_at: string
          created_by: string | null
          failed_payment_count: number | null
          frequency: string
          grace_period_days: number | null
          id: string
          installment_amount: number
          installments: number
          invoice_id: string
          late_fee_amount: number | null
          max_failed_payments: number | null
          payment_method_id: string | null
          plan_name: string
          start_date: string
          status: string
          tenant_id: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          auto_debit?: boolean | null
          created_at?: string
          created_by?: string | null
          failed_payment_count?: number | null
          frequency: string
          grace_period_days?: number | null
          id?: string
          installment_amount: number
          installments: number
          invoice_id: string
          late_fee_amount?: number | null
          max_failed_payments?: number | null
          payment_method_id?: string | null
          plan_name: string
          start_date: string
          status?: string
          tenant_id: string
          total_amount: number
          updated_at?: string
        }
        Update: {
          auto_debit?: boolean | null
          created_at?: string
          created_by?: string | null
          failed_payment_count?: number | null
          frequency?: string
          grace_period_days?: number | null
          id?: string
          installment_amount?: number
          installments?: number
          invoice_id?: string
          late_fee_amount?: number | null
          max_failed_payments?: number | null
          payment_method_id?: string | null
          plan_name?: string
          start_date?: string
          status?: string
          tenant_id?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_plans_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_transactions: {
        Row: {
          amount: number
          audit_trail: Json | null
          card_brand: string | null
          card_last_four: string | null
          card_token: string | null
          client_id: string
          completed_at: string | null
          created_at: string | null
          currency: Database["public"]["Enums"]["currency_code"] | null
          error_code: string | null
          error_details: Json | null
          error_message: string | null
          external_transaction_id: string | null
          id: string
          initiated_at: string | null
          ip_address: unknown | null
          max_retries: number | null
          net_amount: number | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_processor: string | null
          processed_at: string | null
          processing_fee: number | null
          proposal_id: string
          retry_count: number | null
          status: Database["public"]["Enums"]["payment_status"] | null
          tenant_id: string
          transaction_id: string | null
          updated_at: string | null
          user_agent: string | null
        }
        Insert: {
          amount: number
          audit_trail?: Json | null
          card_brand?: string | null
          card_last_four?: string | null
          card_token?: string | null
          client_id: string
          completed_at?: string | null
          created_at?: string | null
          currency?: Database["public"]["Enums"]["currency_code"] | null
          error_code?: string | null
          error_details?: Json | null
          error_message?: string | null
          external_transaction_id?: string | null
          id?: string
          initiated_at?: string | null
          ip_address?: unknown | null
          max_retries?: number | null
          net_amount?: number | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_processor?: string | null
          processed_at?: string | null
          processing_fee?: number | null
          proposal_id: string
          retry_count?: number | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          tenant_id: string
          transaction_id?: string | null
          updated_at?: string | null
          user_agent?: string | null
        }
        Update: {
          amount?: number
          audit_trail?: Json | null
          card_brand?: string | null
          card_last_four?: string | null
          card_token?: string | null
          client_id?: string
          completed_at?: string | null
          created_at?: string | null
          currency?: Database["public"]["Enums"]["currency_code"] | null
          error_code?: string | null
          error_details?: Json | null
          error_message?: string | null
          external_transaction_id?: string | null
          id?: string
          initiated_at?: string | null
          ip_address?: unknown | null
          max_retries?: number | null
          net_amount?: number | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_processor?: string | null
          processed_at?: string | null
          processing_fee?: number | null
          proposal_id?: string
          retry_count?: number | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          tenant_id?: string
          transaction_id?: string | null
          updated_at?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          currency: string
          failure_reason: string | null
          fraud_flags: Json | null
          fraud_score: number | null
          gateway_response: Json | null
          gateway_transaction_id: string | null
          id: string
          invoice_id: string | null
          max_retries: number | null
          next_retry_at: string | null
          notes: string | null
          payment_date: string
          payment_method: string
          payment_reference: string
          reconciled_at: string | null
          reconciled_by: string | null
          reconciliation_status: string | null
          retry_count: number | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          currency?: string
          failure_reason?: string | null
          fraud_flags?: Json | null
          fraud_score?: number | null
          gateway_response?: Json | null
          gateway_transaction_id?: string | null
          id?: string
          invoice_id?: string | null
          max_retries?: number | null
          next_retry_at?: string | null
          notes?: string | null
          payment_date: string
          payment_method: string
          payment_reference: string
          reconciled_at?: string | null
          reconciled_by?: string | null
          reconciliation_status?: string | null
          retry_count?: number | null
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          currency?: string
          failure_reason?: string | null
          fraud_flags?: Json | null
          fraud_score?: number | null
          gateway_response?: Json | null
          gateway_transaction_id?: string | null
          id?: string
          invoice_id?: string | null
          max_retries?: number | null
          next_retry_at?: string | null
          notes?: string | null
          payment_date?: string
          payment_method?: string
          payment_reference?: string
          reconciled_at?: string | null
          reconciled_by?: string | null
          reconciliation_status?: string | null
          retry_count?: number | null
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_metrics: {
        Row: {
          api_endpoint: string | null
          browser: string | null
          connection_type: string | null
          created_at: string | null
          device_type: string | null
          id: string
          location_country: string | null
          measured_at: string | null
          metric_name: string
          metric_type: string
          page_url: string | null
          session_id: string | null
          tenant_id: string
          unit: string
          user_id: string | null
          value: number
        }
        Insert: {
          api_endpoint?: string | null
          browser?: string | null
          connection_type?: string | null
          created_at?: string | null
          device_type?: string | null
          id?: string
          location_country?: string | null
          measured_at?: string | null
          metric_name: string
          metric_type: string
          page_url?: string | null
          session_id?: string | null
          tenant_id: string
          unit: string
          user_id?: string | null
          value: number
        }
        Update: {
          api_endpoint?: string | null
          browser?: string | null
          connection_type?: string | null
          created_at?: string | null
          device_type?: string | null
          id?: string
          location_country?: string | null
          measured_at?: string | null
          metric_name?: string
          metric_type?: string
          page_url?: string | null
          session_id?: string | null
          tenant_id?: string
          unit?: string
          user_id?: string | null
          value?: number
        }
        Relationships: []
      }
      prediction_models: {
        Row: {
          accuracy_score: number | null
          confidence_threshold: number | null
          created_at: string
          created_by: string | null
          data_source: string
          description: string | null
          fallback_method: string | null
          features: Json
          id: string
          is_active: boolean | null
          last_trained_at: string | null
          model_parameters: Json | null
          model_type: string
          name: string
          performance_metrics: Json | null
          status: string
          target_column: string | null
          tenant_id: string
          training_config: Json | null
          training_data_count: number | null
          training_duration_ms: number | null
          updated_at: string
        }
        Insert: {
          accuracy_score?: number | null
          confidence_threshold?: number | null
          created_at?: string
          created_by?: string | null
          data_source: string
          description?: string | null
          fallback_method?: string | null
          features?: Json
          id?: string
          is_active?: boolean | null
          last_trained_at?: string | null
          model_parameters?: Json | null
          model_type: string
          name: string
          performance_metrics?: Json | null
          status?: string
          target_column?: string | null
          tenant_id: string
          training_config?: Json | null
          training_data_count?: number | null
          training_duration_ms?: number | null
          updated_at?: string
        }
        Update: {
          accuracy_score?: number | null
          confidence_threshold?: number | null
          created_at?: string
          created_by?: string | null
          data_source?: string
          description?: string | null
          fallback_method?: string | null
          features?: Json
          id?: string
          is_active?: boolean | null
          last_trained_at?: string | null
          model_parameters?: Json | null
          model_type?: string
          name?: string
          performance_metrics?: Json | null
          status?: string
          target_column?: string | null
          tenant_id?: string
          training_config?: Json | null
          training_data_count?: number | null
          training_duration_ms?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      predictions: {
        Row: {
          actual_recorded_at: string | null
          actual_value: Json | null
          confidence_score: number
          created_at: string
          deviation_percent: number | null
          expires_at: string | null
          id: string
          input_data: Json
          is_accurate: boolean | null
          model_id: string
          predicted_value: Json
          prediction_interval: Json | null
          prediction_type: string
          probability_distribution: Json | null
          tenant_id: string
        }
        Insert: {
          actual_recorded_at?: string | null
          actual_value?: Json | null
          confidence_score: number
          created_at?: string
          deviation_percent?: number | null
          expires_at?: string | null
          id?: string
          input_data: Json
          is_accurate?: boolean | null
          model_id: string
          predicted_value: Json
          prediction_interval?: Json | null
          prediction_type: string
          probability_distribution?: Json | null
          tenant_id: string
        }
        Update: {
          actual_recorded_at?: string | null
          actual_value?: Json | null
          confidence_score?: number
          created_at?: string
          deviation_percent?: number | null
          expires_at?: string | null
          id?: string
          input_data?: Json
          is_accurate?: boolean | null
          model_id?: string
          predicted_value?: Json
          prediction_interval?: Json | null
          prediction_type?: string
          probability_distribution?: Json | null
          tenant_id?: string
        }
        Relationships: []
      }
      pricing_rules: {
        Row: {
          base_rate: number
          created_at: string | null
          created_by: string | null
          currency: Database["public"]["Enums"]["currency_code"] | null
          discount_rules: Json | null
          effective_from: string | null
          effective_until: string | null
          id: string
          is_active: boolean | null
          maximum_amount: number | null
          minimum_amount: number | null
          name: string
          pricing_type: Database["public"]["Enums"]["pricing_type"]
          tax_rate: number | null
          tenant_id: string
          tier_rules: Json | null
          unit_type: string | null
          updated_at: string | null
        }
        Insert: {
          base_rate: number
          created_at?: string | null
          created_by?: string | null
          currency?: Database["public"]["Enums"]["currency_code"] | null
          discount_rules?: Json | null
          effective_from?: string | null
          effective_until?: string | null
          id?: string
          is_active?: boolean | null
          maximum_amount?: number | null
          minimum_amount?: number | null
          name: string
          pricing_type: Database["public"]["Enums"]["pricing_type"]
          tax_rate?: number | null
          tenant_id: string
          tier_rules?: Json | null
          unit_type?: string | null
          updated_at?: string | null
        }
        Update: {
          base_rate?: number
          created_at?: string | null
          created_by?: string | null
          currency?: Database["public"]["Enums"]["currency_code"] | null
          discount_rules?: Json | null
          effective_from?: string | null
          effective_until?: string | null
          id?: string
          is_active?: boolean | null
          maximum_amount?: number | null
          minimum_amount?: number | null
          name?: string
          pricing_type?: Database["public"]["Enums"]["pricing_type"]
          tax_rate?: number | null
          tenant_id?: string
          tier_rules?: Json | null
          unit_type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      proposal_approvals: {
        Row: {
          approval_level: number | null
          approved_at: string | null
          approver_id: string
          comments: string | null
          created_at: string | null
          id: string
          notification_errors: Json | null
          notification_sent: boolean | null
          proposal_id: string
          status: Database["public"]["Enums"]["proposal_approval_status"] | null
          tenant_id: string
          timeout_at: string | null
        }
        Insert: {
          approval_level?: number | null
          approved_at?: string | null
          approver_id: string
          comments?: string | null
          created_at?: string | null
          id?: string
          notification_errors?: Json | null
          notification_sent?: boolean | null
          proposal_id: string
          status?:
            | Database["public"]["Enums"]["proposal_approval_status"]
            | null
          tenant_id: string
          timeout_at?: string | null
        }
        Update: {
          approval_level?: number | null
          approved_at?: string | null
          approver_id?: string
          comments?: string | null
          created_at?: string | null
          id?: string
          notification_errors?: Json | null
          notification_sent?: boolean | null
          proposal_id?: string
          status?:
            | Database["public"]["Enums"]["proposal_approval_status"]
            | null
          tenant_id?: string
          timeout_at?: string | null
        }
        Relationships: []
      }
      proposal_comments: {
        Row: {
          attachments: Json | null
          client_contact_id: string | null
          comment_type: string | null
          content: string
          created_at: string | null
          id: string
          is_internal: boolean | null
          is_moderated: boolean | null
          moderation_notes: string | null
          moderation_status: string | null
          parent_comment_id: string | null
          proposal_id: string
          tenant_id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          attachments?: Json | null
          client_contact_id?: string | null
          comment_type?: string | null
          content: string
          created_at?: string | null
          id?: string
          is_internal?: boolean | null
          is_moderated?: boolean | null
          moderation_notes?: string | null
          moderation_status?: string | null
          parent_comment_id?: string | null
          proposal_id: string
          tenant_id: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          attachments?: Json | null
          client_contact_id?: string | null
          comment_type?: string | null
          content?: string
          created_at?: string | null
          id?: string
          is_internal?: boolean | null
          is_moderated?: boolean | null
          moderation_notes?: string | null
          moderation_status?: string | null
          parent_comment_id?: string | null
          proposal_id?: string
          tenant_id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      proposal_items: {
        Row: {
          created_at: string | null
          description: string | null
          discount_percent: number | null
          id: string
          item_order: number
          item_type: string | null
          metadata: Json | null
          name: string
          proposal_id: string
          quantity: number | null
          tax_percent: number | null
          tenant_id: string
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          discount_percent?: number | null
          id?: string
          item_order: number
          item_type?: string | null
          metadata?: Json | null
          name: string
          proposal_id: string
          quantity?: number | null
          tax_percent?: number | null
          tenant_id: string
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string | null
          description?: string | null
          discount_percent?: number | null
          id?: string
          item_order?: number
          item_type?: string | null
          metadata?: Json | null
          name?: string
          proposal_id?: string
          quantity?: number | null
          tax_percent?: number | null
          tenant_id?: string
          total_price?: number
          unit_price?: number
        }
        Relationships: []
      }
      proposal_notifications: {
        Row: {
          content: string | null
          created_at: string | null
          delivered_at: string | null
          delivery_attempts: number | null
          error_details: Json | null
          error_message: string | null
          id: string
          last_attempt_at: string | null
          notification_type: string
          opened_at: string | null
          proposal_id: string
          recipient_email: string
          sent_at: string | null
          status: string | null
          subject: string
          tenant_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          delivered_at?: string | null
          delivery_attempts?: number | null
          error_details?: Json | null
          error_message?: string | null
          id?: string
          last_attempt_at?: string | null
          notification_type: string
          opened_at?: string | null
          proposal_id: string
          recipient_email: string
          sent_at?: string | null
          status?: string | null
          subject: string
          tenant_id: string
        }
        Update: {
          content?: string | null
          created_at?: string | null
          delivered_at?: string | null
          delivery_attempts?: number | null
          error_details?: Json | null
          error_message?: string | null
          id?: string
          last_attempt_at?: string | null
          notification_type?: string
          opened_at?: string | null
          proposal_id?: string
          recipient_email?: string
          sent_at?: string | null
          status?: string | null
          subject?: string
          tenant_id?: string
        }
        Relationships: []
      }
      proposal_signatures: {
        Row: {
          created_at: string | null
          delivery_attempts: number | null
          delivery_errors: Json | null
          expires_at: string | null
          id: string
          ip_address: unknown | null
          is_verified: boolean | null
          location_data: Json | null
          proposal_id: string
          requested_at: string | null
          signature_data: Json | null
          signature_image_url: string | null
          signature_type: Database["public"]["Enums"]["signature_type"]
          signed_at: string | null
          signer_email: string
          signer_id: string | null
          signer_name: string
          tenant_id: string
          user_agent: string | null
          verification_code: string | null
          verification_method: string | null
        }
        Insert: {
          created_at?: string | null
          delivery_attempts?: number | null
          delivery_errors?: Json | null
          expires_at?: string | null
          id?: string
          ip_address?: unknown | null
          is_verified?: boolean | null
          location_data?: Json | null
          proposal_id: string
          requested_at?: string | null
          signature_data?: Json | null
          signature_image_url?: string | null
          signature_type: Database["public"]["Enums"]["signature_type"]
          signed_at?: string | null
          signer_email: string
          signer_id?: string | null
          signer_name: string
          tenant_id: string
          user_agent?: string | null
          verification_code?: string | null
          verification_method?: string | null
        }
        Update: {
          created_at?: string | null
          delivery_attempts?: number | null
          delivery_errors?: Json | null
          expires_at?: string | null
          id?: string
          ip_address?: unknown | null
          is_verified?: boolean | null
          location_data?: Json | null
          proposal_id?: string
          requested_at?: string | null
          signature_data?: Json | null
          signature_image_url?: string | null
          signature_type?: Database["public"]["Enums"]["signature_type"]
          signed_at?: string | null
          signer_email?: string
          signer_id?: string | null
          signer_name?: string
          tenant_id?: string
          user_agent?: string | null
          verification_code?: string | null
          verification_method?: string | null
        }
        Relationships: []
      }
      proposal_templates: {
        Row: {
          category: string | null
          created_at: string | null
          created_by: string | null
          default_terms: string | null
          default_validity_days: number | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          pricing_structure: Json | null
          required_fields: Json | null
          template_content: Json
          tenant_id: string
          updated_at: string | null
          validation_rules: Json | null
          version: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          default_terms?: string | null
          default_validity_days?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          pricing_structure?: Json | null
          required_fields?: Json | null
          template_content?: Json
          tenant_id: string
          updated_at?: string | null
          validation_rules?: Json | null
          version?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          default_terms?: string | null
          default_validity_days?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          pricing_structure?: Json | null
          required_fields?: Json | null
          template_content?: Json
          tenant_id?: string
          updated_at?: string | null
          validation_rules?: Json | null
          version?: number | null
        }
        Relationships: []
      }
      proposal_tracking: {
        Row: {
          city: string | null
          country: string | null
          created_at: string | null
          event_data: Json | null
          event_type: string
          id: string
          ip_address: unknown | null
          proposal_id: string
          referrer: string | null
          tenant_id: string
          timezone: string | null
          user_agent: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          ip_address?: unknown | null
          proposal_id: string
          referrer?: string | null
          tenant_id: string
          timezone?: string | null
          user_agent?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          ip_address?: unknown | null
          proposal_id?: string
          referrer?: string | null
          tenant_id?: string
          timezone?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      proposal_versions: {
        Row: {
          change_type: string | null
          changes_summary: string | null
          content_snapshot: Json
          created_at: string | null
          created_by: string | null
          id: string
          proposal_id: string
          tenant_id: string
          version_number: number
        }
        Insert: {
          change_type?: string | null
          changes_summary?: string | null
          content_snapshot: Json
          created_at?: string | null
          created_by?: string | null
          id?: string
          proposal_id: string
          tenant_id: string
          version_number: number
        }
        Update: {
          change_type?: string | null
          changes_summary?: string | null
          content_snapshot?: Json
          created_at?: string | null
          created_by?: string | null
          id?: string
          proposal_id?: string
          tenant_id?: string
          version_number?: number
        }
        Relationships: []
      }
      proposals: {
        Row: {
          accepted_date: string | null
          client_id: string
          content: Json | null
          created_at: string | null
          created_by: string | null
          created_date: string | null
          currency: Database["public"]["Enums"]["currency_code"] | null
          delivery_errors: Json | null
          delivery_terms: string | null
          description: string | null
          discount_amount: number | null
          final_amount: number | null
          generation_errors: Json | null
          id: string
          last_viewed_at: string | null
          payment_terms: string | null
          proposal_number: string
          sent_date: string | null
          status: Database["public"]["Enums"]["proposal_status"] | null
          tax_amount: number | null
          template_id: string | null
          tenant_id: string
          terms_and_conditions: string | null
          title: string
          total_amount: number | null
          tracking_pixel_id: string | null
          updated_at: string | null
          updated_by: string | null
          valid_until: string | null
          validation_errors: Json | null
          view_count: number | null
          viewed_date: string | null
        }
        Insert: {
          accepted_date?: string | null
          client_id: string
          content?: Json | null
          created_at?: string | null
          created_by?: string | null
          created_date?: string | null
          currency?: Database["public"]["Enums"]["currency_code"] | null
          delivery_errors?: Json | null
          delivery_terms?: string | null
          description?: string | null
          discount_amount?: number | null
          final_amount?: number | null
          generation_errors?: Json | null
          id?: string
          last_viewed_at?: string | null
          payment_terms?: string | null
          proposal_number: string
          sent_date?: string | null
          status?: Database["public"]["Enums"]["proposal_status"] | null
          tax_amount?: number | null
          template_id?: string | null
          tenant_id: string
          terms_and_conditions?: string | null
          title: string
          total_amount?: number | null
          tracking_pixel_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
          valid_until?: string | null
          validation_errors?: Json | null
          view_count?: number | null
          viewed_date?: string | null
        }
        Update: {
          accepted_date?: string | null
          client_id?: string
          content?: Json | null
          created_at?: string | null
          created_by?: string | null
          created_date?: string | null
          currency?: Database["public"]["Enums"]["currency_code"] | null
          delivery_errors?: Json | null
          delivery_terms?: string | null
          description?: string | null
          discount_amount?: number | null
          final_amount?: number | null
          generation_errors?: Json | null
          id?: string
          last_viewed_at?: string | null
          payment_terms?: string | null
          proposal_number?: string
          sent_date?: string | null
          status?: Database["public"]["Enums"]["proposal_status"] | null
          tax_amount?: number | null
          template_id?: string | null
          tenant_id?: string
          terms_and_conditions?: string | null
          title?: string
          total_amount?: number | null
          tracking_pixel_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
          valid_until?: string | null
          validation_errors?: Json | null
          view_count?: number | null
          viewed_date?: string | null
        }
        Relationships: []
      }
      scheduled_assessments: {
        Row: {
          assigned_to: string | null
          client_id: string
          created_at: string
          created_by: string | null
          frequency: string | null
          id: string
          notes: string | null
          notification_sent: boolean | null
          reminder_days_before: number | null
          scheduled_date: string
          status: string
          template_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          client_id: string
          created_at?: string
          created_by?: string | null
          frequency?: string | null
          id?: string
          notes?: string | null
          notification_sent?: boolean | null
          reminder_days_before?: number | null
          scheduled_date: string
          status?: string
          template_id: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          client_id?: string
          created_at?: string
          created_by?: string | null
          frequency?: string | null
          id?: string
          notes?: string | null
          notification_sent?: boolean | null
          reminder_days_before?: number | null
          scheduled_date?: string
          status?: string
          template_id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      security_events: {
        Row: {
          actions_taken: Json | null
          attack_pattern: string | null
          attack_vector: string | null
          automated_response: boolean | null
          blocked: boolean | null
          created_at: string | null
          event_description: string
          event_severity: string | null
          event_type: string
          false_positive: boolean | null
          id: string
          investigated: boolean | null
          investigated_by: string | null
          investigation_notes: string | null
          ip_address: unknown | null
          occurred_at: string | null
          session_id: string | null
          tenant_id: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          actions_taken?: Json | null
          attack_pattern?: string | null
          attack_vector?: string | null
          automated_response?: boolean | null
          blocked?: boolean | null
          created_at?: string | null
          event_description: string
          event_severity?: string | null
          event_type: string
          false_positive?: boolean | null
          id?: string
          investigated?: boolean | null
          investigated_by?: string | null
          investigation_notes?: string | null
          ip_address?: unknown | null
          occurred_at?: string | null
          session_id?: string | null
          tenant_id: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          actions_taken?: Json | null
          attack_pattern?: string | null
          attack_vector?: string | null
          automated_response?: boolean | null
          blocked?: boolean | null
          created_at?: string | null
          event_description?: string
          event_severity?: string | null
          event_type?: string
          false_positive?: boolean | null
          id?: string
          investigated?: boolean | null
          investigated_by?: string | null
          investigation_notes?: string | null
          ip_address?: unknown | null
          occurred_at?: string | null
          session_id?: string | null
          tenant_id?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      service_bookings: {
        Row: {
          all_day: boolean | null
          assigned_technician: string | null
          booking_number: string
          client_id: string
          confirmation_sent: boolean | null
          confirmation_sent_at: string | null
          conflict_details: Json | null
          conflicts_checked_at: string | null
          contact_id: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          end_time: string
          has_conflicts: boolean | null
          id: string
          location_details: Json | null
          location_type: string | null
          original_booking_id: string | null
          reminder_sent: boolean | null
          reminder_sent_at: string | null
          required_resources: Json | null
          reschedule_count: number | null
          reschedule_reason: string | null
          service_id: string | null
          start_time: string
          status: Database["public"]["Enums"]["booking_status"] | null
          tenant_id: string
          timezone: string
          title: string
          updated_at: string | null
        }
        Insert: {
          all_day?: boolean | null
          assigned_technician?: string | null
          booking_number: string
          client_id: string
          confirmation_sent?: boolean | null
          confirmation_sent_at?: string | null
          conflict_details?: Json | null
          conflicts_checked_at?: string | null
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_time: string
          has_conflicts?: boolean | null
          id?: string
          location_details?: Json | null
          location_type?: string | null
          original_booking_id?: string | null
          reminder_sent?: boolean | null
          reminder_sent_at?: string | null
          required_resources?: Json | null
          reschedule_count?: number | null
          reschedule_reason?: string | null
          service_id?: string | null
          start_time: string
          status?: Database["public"]["Enums"]["booking_status"] | null
          tenant_id: string
          timezone: string
          title: string
          updated_at?: string | null
        }
        Update: {
          all_day?: boolean | null
          assigned_technician?: string | null
          booking_number?: string
          client_id?: string
          confirmation_sent?: boolean | null
          confirmation_sent_at?: string | null
          conflict_details?: Json | null
          conflicts_checked_at?: string | null
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_time?: string
          has_conflicts?: boolean | null
          id?: string
          location_details?: Json | null
          location_type?: string | null
          original_booking_id?: string | null
          reminder_sent?: boolean | null
          reminder_sent_at?: string | null
          required_resources?: Json | null
          reschedule_count?: number | null
          reschedule_reason?: string | null
          service_id?: string | null
          start_time?: string
          status?: Database["public"]["Enums"]["booking_status"] | null
          tenant_id?: string
          timezone?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_bookings_assigned_technician_fkey"
            columns: ["assigned_technician"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_bookings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_bookings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_bookings_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_bookings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_bookings_original_booking_id_fkey"
            columns: ["original_booking_id"]
            isOneToOne: false
            referencedRelation: "service_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "service_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_bookings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      service_catalog: {
        Row: {
          approval_required: boolean | null
          auto_assignment_rules: Json | null
          availability_schedule: Json | null
          base_price: number | null
          category: string
          created_at: string | null
          created_by: string | null
          current_active_requests: number | null
          description: string
          id: string
          is_active: boolean | null
          is_available: boolean | null
          max_concurrent_requests: number | null
          name: string
          pricing_model: string | null
          required_fields: Json | null
          required_permissions: string[] | null
          sla_resolution_hours: number | null
          sla_response_hours: number | null
          subcategory: string | null
          tenant_id: string
          updated_at: string | null
          workflow_template: Json | null
        }
        Insert: {
          approval_required?: boolean | null
          auto_assignment_rules?: Json | null
          availability_schedule?: Json | null
          base_price?: number | null
          category: string
          created_at?: string | null
          created_by?: string | null
          current_active_requests?: number | null
          description: string
          id?: string
          is_active?: boolean | null
          is_available?: boolean | null
          max_concurrent_requests?: number | null
          name: string
          pricing_model?: string | null
          required_fields?: Json | null
          required_permissions?: string[] | null
          sla_resolution_hours?: number | null
          sla_response_hours?: number | null
          subcategory?: string | null
          tenant_id: string
          updated_at?: string | null
          workflow_template?: Json | null
        }
        Update: {
          approval_required?: boolean | null
          auto_assignment_rules?: Json | null
          availability_schedule?: Json | null
          base_price?: number | null
          category?: string
          created_at?: string | null
          created_by?: string | null
          current_active_requests?: number | null
          description?: string
          id?: string
          is_active?: boolean | null
          is_available?: boolean | null
          max_concurrent_requests?: number | null
          name?: string
          pricing_model?: string | null
          required_fields?: Json | null
          required_permissions?: string[] | null
          sla_resolution_hours?: number | null
          sla_response_hours?: number | null
          subcategory?: string | null
          tenant_id?: string
          updated_at?: string | null
          workflow_template?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "service_catalog_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_catalog_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      service_requests: {
        Row: {
          actual_completion_date: string | null
          actual_start_date: string | null
          approval_workflow: Json | null
          assigned_to: string | null
          business_justification: string | null
          client_id: string
          contact_id: string | null
          created_at: string | null
          created_by: string | null
          description: string
          estimated_cost: number | null
          estimated_effort_hours: number | null
          id: string
          impact_assessment: Json | null
          priority: Database["public"]["Enums"]["ticket_priority"] | null
          received_approvals: number | null
          request_number: string
          request_type: Database["public"]["Enums"]["request_type"]
          requested_completion_date: string | null
          required_approvals: number | null
          scheduled_end_date: string | null
          scheduled_start_date: string | null
          status: Database["public"]["Enums"]["ticket_status"] | null
          tenant_id: string
          title: string
          updated_at: string | null
          validation_errors: Json | null
        }
        Insert: {
          actual_completion_date?: string | null
          actual_start_date?: string | null
          approval_workflow?: Json | null
          assigned_to?: string | null
          business_justification?: string | null
          client_id: string
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description: string
          estimated_cost?: number | null
          estimated_effort_hours?: number | null
          id?: string
          impact_assessment?: Json | null
          priority?: Database["public"]["Enums"]["ticket_priority"] | null
          received_approvals?: number | null
          request_number: string
          request_type: Database["public"]["Enums"]["request_type"]
          requested_completion_date?: string | null
          required_approvals?: number | null
          scheduled_end_date?: string | null
          scheduled_start_date?: string | null
          status?: Database["public"]["Enums"]["ticket_status"] | null
          tenant_id: string
          title: string
          updated_at?: string | null
          validation_errors?: Json | null
        }
        Update: {
          actual_completion_date?: string | null
          actual_start_date?: string | null
          approval_workflow?: Json | null
          assigned_to?: string | null
          business_justification?: string | null
          client_id?: string
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string
          estimated_cost?: number | null
          estimated_effort_hours?: number | null
          id?: string
          impact_assessment?: Json | null
          priority?: Database["public"]["Enums"]["ticket_priority"] | null
          received_approvals?: number | null
          request_number?: string
          request_type?: Database["public"]["Enums"]["request_type"]
          requested_completion_date?: string | null
          required_approvals?: number | null
          scheduled_end_date?: string | null
          scheduled_start_date?: string | null
          status?: Database["public"]["Enums"]["ticket_status"] | null
          tenant_id?: string
          title?: string
          updated_at?: string | null
          validation_errors?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "service_requests_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      sla_rules: {
        Row: {
          created_at: string
          created_by: string | null
          escalation_rules: Json | null
          id: string
          is_active: boolean | null
          name: string
          priority: string
          resolution_time_hours: number
          response_time_hours: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          escalation_rules?: Json | null
          id?: string
          is_active?: boolean | null
          name: string
          priority: string
          resolution_time_hours?: number
          response_time_hours?: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          escalation_rules?: Json | null
          id?: string
          is_active?: boolean | null
          name?: string
          priority?: string
          resolution_time_hours?: number
          response_time_hours?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sla_rules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          actual_hours: number | null
          approval_required: boolean | null
          approved_at: string | null
          approved_by: string | null
          assigned_to: string | null
          auto_assigned: boolean | null
          category: string | null
          client_id: string
          client_satisfaction_rating: number | null
          closed_at: string | null
          contact_id: string | null
          created_at: string | null
          created_by: string | null
          custom_fields: Json | null
          description: string
          estimated_hours: number | null
          first_response_at: string | null
          id: string
          internal_notes: string | null
          priority: Database["public"]["Enums"]["ticket_priority"] | null
          rejection_reason: string | null
          required_fields_completed: boolean | null
          resolution_target: string | null
          resolved_at: string | null
          sla_breached: boolean | null
          sla_due_date: string | null
          status: Database["public"]["Enums"]["ticket_status"] | null
          subcategory: string | null
          tags: string[] | null
          template_id: string | null
          tenant_id: string
          ticket_number: string
          time_tracking_enabled: boolean | null
          title: string
          updated_at: string | null
          validation_errors: Json | null
        }
        Insert: {
          actual_hours?: number | null
          approval_required?: boolean | null
          approved_at?: string | null
          approved_by?: string | null
          assigned_to?: string | null
          auto_assigned?: boolean | null
          category?: string | null
          client_id: string
          client_satisfaction_rating?: number | null
          closed_at?: string | null
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          custom_fields?: Json | null
          description: string
          estimated_hours?: number | null
          first_response_at?: string | null
          id?: string
          internal_notes?: string | null
          priority?: Database["public"]["Enums"]["ticket_priority"] | null
          rejection_reason?: string | null
          required_fields_completed?: boolean | null
          resolution_target?: string | null
          resolved_at?: string | null
          sla_breached?: boolean | null
          sla_due_date?: string | null
          status?: Database["public"]["Enums"]["ticket_status"] | null
          subcategory?: string | null
          tags?: string[] | null
          template_id?: string | null
          tenant_id: string
          ticket_number: string
          time_tracking_enabled?: boolean | null
          title: string
          updated_at?: string | null
          validation_errors?: Json | null
        }
        Update: {
          actual_hours?: number | null
          approval_required?: boolean | null
          approved_at?: string | null
          approved_by?: string | null
          assigned_to?: string | null
          auto_assigned?: boolean | null
          category?: string | null
          client_id?: string
          client_satisfaction_rating?: number | null
          closed_at?: string | null
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          custom_fields?: Json | null
          description?: string
          estimated_hours?: number | null
          first_response_at?: string | null
          id?: string
          internal_notes?: string | null
          priority?: Database["public"]["Enums"]["ticket_priority"] | null
          rejection_reason?: string | null
          required_fields_completed?: boolean | null
          resolution_target?: string | null
          resolved_at?: string | null
          sla_breached?: boolean | null
          sla_due_date?: string | null
          status?: Database["public"]["Enums"]["ticket_status"] | null
          subcategory?: string | null
          tags?: string[] | null
          template_id?: string | null
          tenant_id?: string
          ticket_number?: string
          time_tracking_enabled?: boolean | null
          title?: string
          updated_at?: string | null
          validation_errors?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_support_tickets_template"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "ticket_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_queue: {
        Row: {
          action: string
          created_at: string
          data: Json
          entity_id: string | null
          entity_type: string
          error_message: string | null
          id: string
          local_id: string | null
          max_retries: number | null
          priority: number | null
          retry_count: number | null
          sync_status: string | null
          technician_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          action: string
          created_at?: string
          data: Json
          entity_id?: string | null
          entity_type: string
          error_message?: string | null
          id?: string
          local_id?: string | null
          max_retries?: number | null
          priority?: number | null
          retry_count?: number | null
          sync_status?: string | null
          technician_id: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          action?: string
          created_at?: string
          data?: Json
          entity_id?: string | null
          entity_type?: string
          error_message?: string | null
          id?: string
          local_id?: string | null
          max_retries?: number | null
          priority?: number | null
          retry_count?: number | null
          sync_status?: string | null
          technician_id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      system_alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          alert_level: string | null
          alert_type: string
          auto_resolve: boolean | null
          created_at: string | null
          current_value: number | null
          description: string
          escalation_level: number | null
          id: string
          metric_name: string | null
          notification_channels: Json | null
          notification_sent: boolean | null
          resolved_at: string | null
          source_id: string | null
          source_type: string | null
          status: string | null
          tenant_id: string
          threshold_value: number | null
          title: string
          triggered_at: string | null
          updated_at: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_level?: string | null
          alert_type: string
          auto_resolve?: boolean | null
          created_at?: string | null
          current_value?: number | null
          description: string
          escalation_level?: number | null
          id?: string
          metric_name?: string | null
          notification_channels?: Json | null
          notification_sent?: boolean | null
          resolved_at?: string | null
          source_id?: string | null
          source_type?: string | null
          status?: string | null
          tenant_id: string
          threshold_value?: number | null
          title: string
          triggered_at?: string | null
          updated_at?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_level?: string | null
          alert_type?: string
          auto_resolve?: boolean | null
          created_at?: string | null
          current_value?: number | null
          description?: string
          escalation_level?: number | null
          id?: string
          metric_name?: string | null
          notification_channels?: Json | null
          notification_sent?: boolean | null
          resolved_at?: string | null
          source_id?: string | null
          source_type?: string | null
          status?: string | null
          tenant_id?: string
          threshold_value?: number | null
          title?: string
          triggered_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      system_health_checks: {
        Row: {
          alert_threshold: number | null
          check_details: Json | null
          check_interval_seconds: number | null
          checked_at: string | null
          consecutive_failures: number | null
          created_at: string | null
          critical_threshold: number | null
          endpoint_url: string | null
          error_message: string | null
          id: string
          last_alert_sent_at: string | null
          next_check_at: string | null
          response_time_ms: number | null
          service_name: string
          service_type: string
          status: string
          status_code: number | null
          tenant_id: string
          warning_threshold: number | null
        }
        Insert: {
          alert_threshold?: number | null
          check_details?: Json | null
          check_interval_seconds?: number | null
          checked_at?: string | null
          consecutive_failures?: number | null
          created_at?: string | null
          critical_threshold?: number | null
          endpoint_url?: string | null
          error_message?: string | null
          id?: string
          last_alert_sent_at?: string | null
          next_check_at?: string | null
          response_time_ms?: number | null
          service_name: string
          service_type: string
          status: string
          status_code?: number | null
          tenant_id: string
          warning_threshold?: number | null
        }
        Update: {
          alert_threshold?: number | null
          check_details?: Json | null
          check_interval_seconds?: number | null
          checked_at?: string | null
          consecutive_failures?: number | null
          created_at?: string | null
          critical_threshold?: number | null
          endpoint_url?: string | null
          error_message?: string | null
          id?: string
          last_alert_sent_at?: string | null
          next_check_at?: string | null
          response_time_ms?: number | null
          service_name?: string
          service_type?: string
          status?: string
          status_code?: number | null
          tenant_id?: string
          warning_threshold?: number | null
        }
        Relationships: []
      }
      system_monitors: {
        Row: {
          alert_config: Json | null
          alert_count: number | null
          check_config: Json
          check_interval_minutes: number | null
          created_at: string
          description: string | null
          id: string
          is_critical: boolean | null
          last_alert_at: string | null
          last_checked_at: string | null
          monitor_type: string
          name: string
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          alert_config?: Json | null
          alert_count?: number | null
          check_config?: Json
          check_interval_minutes?: number | null
          created_at?: string
          description?: string | null
          id?: string
          is_critical?: boolean | null
          last_alert_at?: string | null
          last_checked_at?: string | null
          monitor_type: string
          name: string
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          alert_config?: Json | null
          alert_count?: number | null
          check_config?: Json
          check_interval_minutes?: number | null
          created_at?: string
          description?: string | null
          id?: string
          is_critical?: boolean | null
          last_alert_at?: string | null
          last_checked_at?: string | null
          monitor_type?: string
          name?: string
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      tenants: {
        Row: {
          created_at: string
          id: string
          name: string
          plan: Database["public"]["Enums"]["tenant_plan"]
          settings: Json | null
          subdomain: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          plan?: Database["public"]["Enums"]["tenant_plan"]
          settings?: Json | null
          subdomain: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          plan?: Database["public"]["Enums"]["tenant_plan"]
          settings?: Json | null
          subdomain?: string
          updated_at?: string
        }
        Relationships: []
      }
      ticket_templates: {
        Row: {
          category: string | null
          created_at: string
          created_by: string | null
          custom_fields: Json | null
          default_assignee_id: string | null
          description: string | null
          description_template: string
          estimated_hours: number | null
          id: string
          is_active: boolean | null
          name: string
          priority: string
          tenant_id: string
          title_template: string
          updated_at: string
          usage_count: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          custom_fields?: Json | null
          default_assignee_id?: string | null
          description?: string | null
          description_template: string
          estimated_hours?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          priority?: string
          tenant_id: string
          title_template: string
          updated_at?: string
          usage_count?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          custom_fields?: Json | null
          default_assignee_id?: string | null
          description?: string | null
          description_template?: string
          estimated_hours?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          priority?: string
          tenant_id?: string
          title_template?: string
          updated_at?: string
          usage_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_templates_default_assignee_id_fkey"
            columns: ["default_assignee_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      time_entries: {
        Row: {
          billable: boolean | null
          created_at: string
          duration_minutes: number | null
          end_time: string | null
          entry_type: string
          id: string
          local_id: string | null
          location_end: Json | null
          location_start: Json | null
          notes: string | null
          offline_created_at: string | null
          start_time: string
          sync_status: string | null
          technician_id: string
          tenant_id: string
          updated_at: string
          work_order_id: string | null
        }
        Insert: {
          billable?: boolean | null
          created_at?: string
          duration_minutes?: number | null
          end_time?: string | null
          entry_type: string
          id?: string
          local_id?: string | null
          location_end?: Json | null
          location_start?: Json | null
          notes?: string | null
          offline_created_at?: string | null
          start_time: string
          sync_status?: string | null
          technician_id: string
          tenant_id: string
          updated_at?: string
          work_order_id?: string | null
        }
        Update: {
          billable?: boolean | null
          created_at?: string
          duration_minutes?: number | null
          end_time?: string | null
          entry_type?: string
          id?: string
          local_id?: string | null
          location_end?: Json | null
          location_start?: Json | null
          notes?: string | null
          offline_created_at?: string | null
          start_time?: string
          sync_status?: string | null
          technician_id?: string
          tenant_id?: string
          updated_at?: string
          work_order_id?: string | null
        }
        Relationships: []
      }
      time_tracking_entries: {
        Row: {
          billable: boolean | null
          created_at: string
          description: string | null
          ended_at: string | null
          hours_worked: number
          id: string
          started_at: string | null
          tenant_id: string
          ticket_id: string
          user_id: string | null
          work_type: string | null
        }
        Insert: {
          billable?: boolean | null
          created_at?: string
          description?: string | null
          ended_at?: string | null
          hours_worked?: number
          id?: string
          started_at?: string | null
          tenant_id: string
          ticket_id: string
          user_id?: string | null
          work_type?: string | null
        }
        Update: {
          billable?: boolean | null
          created_at?: string
          description?: string | null
          ended_at?: string | null
          hours_worked?: number
          id?: string
          started_at?: string | null
          tenant_id?: string
          ticket_id?: string
          user_id?: string | null
          work_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "time_tracking_entries_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_tracking_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      transaction_line_items: {
        Row: {
          account_id: string
          created_at: string
          credit_amount: number | null
          debit_amount: number | null
          description: string | null
          id: string
          sort_order: number | null
          tenant_id: string
          transaction_id: string
        }
        Insert: {
          account_id: string
          created_at?: string
          credit_amount?: number | null
          debit_amount?: number | null
          description?: string | null
          id?: string
          sort_order?: number | null
          tenant_id: string
          transaction_id: string
        }
        Update: {
          account_id?: string
          created_at?: string
          credit_amount?: number | null
          debit_amount?: number | null
          description?: string | null
          id?: string
          sort_order?: number | null
          tenant_id?: string
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transaction_line_items_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "financial_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_line_items_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "financial_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activity_logs: {
        Row: {
          activity_details: Json | null
          activity_name: string
          activity_type: string
          anomaly_flags: Json | null
          browser: string | null
          city: string | null
          country: string | null
          created_at: string | null
          device_type: string | null
          duration_ms: number | null
          id: string
          ip_address: unknown | null
          is_suspicious: boolean | null
          occurred_at: string | null
          os: string | null
          page_url: string | null
          referrer_url: string | null
          risk_score: number | null
          screen_resolution: string | null
          session_id: string
          tenant_id: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          activity_details?: Json | null
          activity_name: string
          activity_type: string
          anomaly_flags?: Json | null
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          device_type?: string | null
          duration_ms?: number | null
          id?: string
          ip_address?: unknown | null
          is_suspicious?: boolean | null
          occurred_at?: string | null
          os?: string | null
          page_url?: string | null
          referrer_url?: string | null
          risk_score?: number | null
          screen_resolution?: string | null
          session_id: string
          tenant_id: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          activity_details?: Json | null
          activity_name?: string
          activity_type?: string
          anomaly_flags?: Json | null
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          device_type?: string | null
          duration_ms?: number | null
          id?: string
          ip_address?: unknown | null
          is_suspicious?: boolean | null
          occurred_at?: string | null
          os?: string | null
          page_url?: string | null
          referrer_url?: string | null
          risk_score?: number | null
          screen_resolution?: string | null
          session_id?: string
          tenant_id?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_auth_security: {
        Row: {
          backup_codes: Json | null
          created_at: string | null
          failed_login_attempts: number | null
          id: string
          is_locked: boolean | null
          last_2fa_verification: string | null
          last_activity: string | null
          last_failed_login: string | null
          last_password_change: string | null
          lockout_reason: Database["public"]["Enums"]["lockout_reason"] | null
          lockout_until: string | null
          max_concurrent_sessions: number | null
          password_history: Json | null
          password_reset_attempts: number | null
          password_reset_expires: string | null
          password_reset_token: string | null
          session_timeout_minutes: number | null
          tenant_id: string
          two_factor_enabled: boolean | null
          two_factor_secret: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          backup_codes?: Json | null
          created_at?: string | null
          failed_login_attempts?: number | null
          id?: string
          is_locked?: boolean | null
          last_2fa_verification?: string | null
          last_activity?: string | null
          last_failed_login?: string | null
          last_password_change?: string | null
          lockout_reason?: Database["public"]["Enums"]["lockout_reason"] | null
          lockout_until?: string | null
          max_concurrent_sessions?: number | null
          password_history?: Json | null
          password_reset_attempts?: number | null
          password_reset_expires?: string | null
          password_reset_token?: string | null
          session_timeout_minutes?: number | null
          tenant_id: string
          two_factor_enabled?: boolean | null
          two_factor_secret?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          backup_codes?: Json | null
          created_at?: string | null
          failed_login_attempts?: number | null
          id?: string
          is_locked?: boolean | null
          last_2fa_verification?: string | null
          last_activity?: string | null
          last_failed_login?: string | null
          last_password_change?: string | null
          lockout_reason?: Database["public"]["Enums"]["lockout_reason"] | null
          lockout_until?: string | null
          max_concurrent_sessions?: number | null
          password_history?: Json | null
          password_reset_attempts?: number | null
          password_reset_expires?: string | null
          password_reset_token?: string | null
          session_timeout_minutes?: number | null
          tenant_id?: string
          two_factor_enabled?: boolean | null
          two_factor_secret?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_auth_security_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_auth_security_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sessions: {
        Row: {
          created_at: string | null
          device_info: Json | null
          expires_at: string
          id: string
          ip_address: unknown | null
          last_activity: string | null
          location_data: Json | null
          session_token: string
          status: Database["public"]["Enums"]["session_status"] | null
          tenant_id: string
          terminated_at: string | null
          terminated_reason: string | null
          updated_at: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          device_info?: Json | null
          expires_at: string
          id?: string
          ip_address?: unknown | null
          last_activity?: string | null
          location_data?: Json | null
          session_token: string
          status?: Database["public"]["Enums"]["session_status"] | null
          tenant_id: string
          terminated_at?: string | null
          terminated_reason?: string | null
          updated_at?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          device_info?: Json | null
          expires_at?: string
          id?: string
          ip_address?: unknown | null
          last_activity?: string | null
          location_data?: Json | null
          session_token?: string
          status?: Database["public"]["Enums"]["session_status"] | null
          tenant_id?: string
          terminated_at?: string | null
          terminated_reason?: string | null
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_sessions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          auth_user_id: string
          avatar_url: string | null
          created_at: string
          email: string
          first_name: string | null
          id: string
          is_active: boolean
          last_name: string | null
          role: Database["public"]["Enums"]["user_role"]
          tenant_id: string
          updated_at: string
        }
        Insert: {
          auth_user_id: string
          avatar_url?: string | null
          created_at?: string
          email: string
          first_name?: string | null
          id?: string
          is_active?: boolean
          last_name?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          tenant_id: string
          updated_at?: string
        }
        Update: {
          auth_user_id?: string
          avatar_url?: string | null
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          is_active?: boolean
          last_name?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_delivery_logs: {
        Row: {
          attempt_number: number | null
          attempted_at: string | null
          completed_at: string | null
          created_at: string | null
          delivery_url: string
          duration_ms: number | null
          error_message: string | null
          event_data: Json
          event_type: string
          id: string
          next_retry_at: string | null
          request_body: Json | null
          request_headers: Json | null
          response_body: string | null
          response_code: number | null
          response_headers: Json | null
          status: string | null
          tenant_id: string
          webhook_id: string | null
        }
        Insert: {
          attempt_number?: number | null
          attempted_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          delivery_url: string
          duration_ms?: number | null
          error_message?: string | null
          event_data: Json
          event_type: string
          id?: string
          next_retry_at?: string | null
          request_body?: Json | null
          request_headers?: Json | null
          response_body?: string | null
          response_code?: number | null
          response_headers?: Json | null
          status?: string | null
          tenant_id: string
          webhook_id?: string | null
        }
        Update: {
          attempt_number?: number | null
          attempted_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          delivery_url?: string
          duration_ms?: number | null
          error_message?: string | null
          event_data?: Json
          event_type?: string
          id?: string
          next_retry_at?: string | null
          request_body?: Json | null
          request_headers?: Json | null
          response_body?: string | null
          response_code?: number | null
          response_headers?: Json | null
          status?: string | null
          tenant_id?: string
          webhook_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "webhook_delivery_logs_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "integration_webhooks"
            referencedColumns: ["id"]
          },
        ]
      }
      work_orders: {
        Row: {
          actual_end_time: string | null
          actual_start_time: string | null
          assigned_technician_id: string | null
          client_id: string | null
          completion_notes: string | null
          created_at: string
          created_by: string | null
          customer_signature: Json | null
          description: string | null
          equipment_details: Json | null
          estimated_duration_minutes: number | null
          id: string
          local_id: string | null
          location_address: string | null
          location_coordinates: Json | null
          offline_created_at: string | null
          photo_attachments: Json | null
          priority: string
          required_parts: Json | null
          scheduled_end_time: string | null
          scheduled_start_time: string | null
          service_type: string | null
          status: string
          sync_status: string | null
          technician_signature: Json | null
          tenant_id: string
          title: string
          updated_at: string
          used_parts: Json | null
          work_order_number: string
        }
        Insert: {
          actual_end_time?: string | null
          actual_start_time?: string | null
          assigned_technician_id?: string | null
          client_id?: string | null
          completion_notes?: string | null
          created_at?: string
          created_by?: string | null
          customer_signature?: Json | null
          description?: string | null
          equipment_details?: Json | null
          estimated_duration_minutes?: number | null
          id?: string
          local_id?: string | null
          location_address?: string | null
          location_coordinates?: Json | null
          offline_created_at?: string | null
          photo_attachments?: Json | null
          priority?: string
          required_parts?: Json | null
          scheduled_end_time?: string | null
          scheduled_start_time?: string | null
          service_type?: string | null
          status?: string
          sync_status?: string | null
          technician_signature?: Json | null
          tenant_id: string
          title: string
          updated_at?: string
          used_parts?: Json | null
          work_order_number: string
        }
        Update: {
          actual_end_time?: string | null
          actual_start_time?: string | null
          assigned_technician_id?: string | null
          client_id?: string | null
          completion_notes?: string | null
          created_at?: string
          created_by?: string | null
          customer_signature?: Json | null
          description?: string | null
          equipment_details?: Json | null
          estimated_duration_minutes?: number | null
          id?: string
          local_id?: string | null
          location_address?: string | null
          location_coordinates?: Json | null
          offline_created_at?: string | null
          photo_attachments?: Json | null
          priority?: string
          required_parts?: Json | null
          scheduled_end_time?: string | null
          scheduled_start_time?: string | null
          service_type?: string | null
          status?: string
          sync_status?: string | null
          technician_signature?: Json | null
          tenant_id?: string
          title?: string
          updated_at?: string
          used_parts?: Json | null
          work_order_number?: string
        }
        Relationships: []
      }
      workflow_executions: {
        Row: {
          completed_at: string | null
          context_data: Json | null
          current_step: Json | null
          duration_ms: number | null
          error_details: Json | null
          error_message: string | null
          error_step: number | null
          execution_log: Json | null
          execution_status: string
          id: string
          intervention_message: string | null
          manual_intervention_required: boolean | null
          retry_attempt: number | null
          rollback_completed: boolean | null
          rollback_steps: Json | null
          started_at: string
          steps_completed: number | null
          steps_total: number | null
          tenant_id: string
          triggered_by: string | null
          workflow_id: string
        }
        Insert: {
          completed_at?: string | null
          context_data?: Json | null
          current_step?: Json | null
          duration_ms?: number | null
          error_details?: Json | null
          error_message?: string | null
          error_step?: number | null
          execution_log?: Json | null
          execution_status?: string
          id?: string
          intervention_message?: string | null
          manual_intervention_required?: boolean | null
          retry_attempt?: number | null
          rollback_completed?: boolean | null
          rollback_steps?: Json | null
          started_at?: string
          steps_completed?: number | null
          steps_total?: number | null
          tenant_id: string
          triggered_by?: string | null
          workflow_id: string
        }
        Update: {
          completed_at?: string | null
          context_data?: Json | null
          current_step?: Json | null
          duration_ms?: number | null
          error_details?: Json | null
          error_message?: string | null
          error_step?: number | null
          execution_log?: Json | null
          execution_status?: string
          id?: string
          intervention_message?: string | null
          manual_intervention_required?: boolean | null
          retry_attempt?: number | null
          rollback_completed?: boolean | null
          rollback_steps?: Json | null
          started_at?: string
          steps_completed?: number | null
          steps_total?: number | null
          tenant_id?: string
          triggered_by?: string | null
          workflow_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      client_stats: {
        Row: {
          active_contracts: number | null
          avg_assessment_score: number | null
          contact_count: number | null
          health_score: number | null
          id: string | null
          last_activity_at: string | null
          name: string | null
          open_tickets: number | null
          recent_activities: number | null
          risk_level: string | null
          satisfaction_rating: number | null
          total_contract_value: number | null
          total_tickets: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      auto_assign_ticket: {
        Args: { ticket_uuid: string }
        Returns: string
      }
      calculate_client_health_score: {
        Args: { client_uuid: string }
        Returns: number
      }
      calculate_sla_due_date: {
        Args:
          | {
              tenant_uuid: string
              ticket_priority: Database["public"]["Enums"]["ticket_priority"]
            }
          | { tenant_uuid: string; ticket_priority: string }
        Returns: string
      }
      extract_email_domain: {
        Args: { email_address: string }
        Returns: string
      }
      get_current_user_tenant_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      is_email_domain_allowed: {
        Args: { client_uuid: string; email_address: string }
        Returns: boolean
      }
      user_has_role: {
        Args: { _role: Database["public"]["Enums"]["user_role"] }
        Returns: boolean
      }
    }
    Enums: {
      approval_status: "pending" | "approved" | "rejected" | "timeout"
      assessment_status: "draft" | "active" | "completed" | "archived"
      auth_event_type:
        | "login_success"
        | "login_failed"
        | "password_reset_requested"
        | "password_reset_completed"
        | "account_locked"
        | "account_unlocked"
        | "2fa_enabled"
        | "2fa_disabled"
        | "session_expired"
      booking_status:
        | "requested"
        | "confirmed"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "rescheduled"
      contract_status:
        | "draft"
        | "pending_approval"
        | "approved"
        | "active"
        | "suspended"
        | "expired"
        | "terminated"
        | "cancelled"
      contract_type:
        | "service"
        | "maintenance"
        | "project"
        | "retainer"
        | "license"
      currency_code: "USD" | "EUR" | "GBP" | "CAD" | "AUD"
      data_export_status:
        | "requested"
        | "processing"
        | "completed"
        | "failed"
        | "expired"
      file_scan_status: "pending" | "scanning" | "clean" | "infected" | "error"
      lockout_reason:
        | "failed_attempts"
        | "security_violation"
        | "admin_action"
        | "suspicious_activity"
      message_status:
        | "draft"
        | "sent"
        | "delivered"
        | "read"
        | "failed"
        | "bounced"
      notification_type: "email" | "sms" | "push" | "in_app"
      opportunity_priority: "low" | "medium" | "high" | "critical"
      opportunity_status:
        | "identified"
        | "qualified"
        | "proposal_sent"
        | "won"
        | "lost"
        | "cancelled"
      payment_method:
        | "credit_card"
        | "debit_card"
        | "bank_transfer"
        | "paypal"
        | "pcbancard"
      payment_status:
        | "pending"
        | "processing"
        | "completed"
        | "failed"
        | "cancelled"
        | "refunded"
      payment_terms:
        | "net_15"
        | "net_30"
        | "net_45"
        | "net_60"
        | "due_on_receipt"
        | "advance_payment"
      pricing_type:
        | "fixed"
        | "hourly"
        | "subscription"
        | "usage_based"
        | "tiered"
      proposal_approval_status: "pending" | "approved" | "rejected" | "timeout"
      proposal_status:
        | "draft"
        | "pending_approval"
        | "approved"
        | "sent"
        | "viewed"
        | "accepted"
        | "rejected"
        | "expired"
        | "cancelled"
      question_type:
        | "text"
        | "number"
        | "boolean"
        | "single_choice"
        | "multiple_choice"
        | "scale"
        | "matrix"
      report_status:
        | "pending"
        | "generating"
        | "completed"
        | "failed"
        | "retrying"
      request_type:
        | "access_request"
        | "service_request"
        | "change_request"
        | "incident_report"
        | "general_inquiry"
      response_status: "in_progress" | "completed" | "validated" | "flagged"
      session_status: "active" | "expired" | "terminated" | "locked"
      signature_type:
        | "electronic"
        | "digital"
        | "wet_signature"
        | "api_signature"
      tenant_plan: "starter" | "professional" | "enterprise"
      ticket_priority: "low" | "medium" | "high" | "urgent" | "critical"
      ticket_status:
        | "draft"
        | "submitted"
        | "in_review"
        | "approved"
        | "rejected"
        | "in_progress"
        | "pending_client"
        | "resolved"
        | "closed"
      user_role: "admin" | "manager" | "technician"
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
      approval_status: ["pending", "approved", "rejected", "timeout"],
      assessment_status: ["draft", "active", "completed", "archived"],
      auth_event_type: [
        "login_success",
        "login_failed",
        "password_reset_requested",
        "password_reset_completed",
        "account_locked",
        "account_unlocked",
        "2fa_enabled",
        "2fa_disabled",
        "session_expired",
      ],
      booking_status: [
        "requested",
        "confirmed",
        "in_progress",
        "completed",
        "cancelled",
        "rescheduled",
      ],
      contract_status: [
        "draft",
        "pending_approval",
        "approved",
        "active",
        "suspended",
        "expired",
        "terminated",
        "cancelled",
      ],
      contract_type: [
        "service",
        "maintenance",
        "project",
        "retainer",
        "license",
      ],
      currency_code: ["USD", "EUR", "GBP", "CAD", "AUD"],
      data_export_status: [
        "requested",
        "processing",
        "completed",
        "failed",
        "expired",
      ],
      file_scan_status: ["pending", "scanning", "clean", "infected", "error"],
      lockout_reason: [
        "failed_attempts",
        "security_violation",
        "admin_action",
        "suspicious_activity",
      ],
      message_status: [
        "draft",
        "sent",
        "delivered",
        "read",
        "failed",
        "bounced",
      ],
      notification_type: ["email", "sms", "push", "in_app"],
      opportunity_priority: ["low", "medium", "high", "critical"],
      opportunity_status: [
        "identified",
        "qualified",
        "proposal_sent",
        "won",
        "lost",
        "cancelled",
      ],
      payment_method: [
        "credit_card",
        "debit_card",
        "bank_transfer",
        "paypal",
        "pcbancard",
      ],
      payment_status: [
        "pending",
        "processing",
        "completed",
        "failed",
        "cancelled",
        "refunded",
      ],
      payment_terms: [
        "net_15",
        "net_30",
        "net_45",
        "net_60",
        "due_on_receipt",
        "advance_payment",
      ],
      pricing_type: [
        "fixed",
        "hourly",
        "subscription",
        "usage_based",
        "tiered",
      ],
      proposal_approval_status: ["pending", "approved", "rejected", "timeout"],
      proposal_status: [
        "draft",
        "pending_approval",
        "approved",
        "sent",
        "viewed",
        "accepted",
        "rejected",
        "expired",
        "cancelled",
      ],
      question_type: [
        "text",
        "number",
        "boolean",
        "single_choice",
        "multiple_choice",
        "scale",
        "matrix",
      ],
      report_status: [
        "pending",
        "generating",
        "completed",
        "failed",
        "retrying",
      ],
      request_type: [
        "access_request",
        "service_request",
        "change_request",
        "incident_report",
        "general_inquiry",
      ],
      response_status: ["in_progress", "completed", "validated", "flagged"],
      session_status: ["active", "expired", "terminated", "locked"],
      signature_type: [
        "electronic",
        "digital",
        "wet_signature",
        "api_signature",
      ],
      tenant_plan: ["starter", "professional", "enterprise"],
      ticket_priority: ["low", "medium", "high", "urgent", "critical"],
      ticket_status: [
        "draft",
        "submitted",
        "in_review",
        "approved",
        "rejected",
        "in_progress",
        "pending_client",
        "resolved",
        "closed",
      ],
      user_role: ["admin", "manager", "technician"],
    },
  },
} as const
