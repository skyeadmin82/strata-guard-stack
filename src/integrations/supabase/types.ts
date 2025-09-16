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
      clients: {
        Row: {
          address: Json | null
          company_size: string | null
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          industry: string | null
          name: string
          notes: string | null
          phone: string | null
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
          email?: string | null
          id?: string
          industry?: string | null
          name: string
          notes?: string | null
          phone?: string | null
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
          email?: string | null
          id?: string
          industry?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_user_tenant_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      user_has_role: {
        Args: { _role: Database["public"]["Enums"]["user_role"] }
        Returns: boolean
      }
    }
    Enums: {
      approval_status: "pending" | "approved" | "rejected" | "timeout"
      assessment_status: "draft" | "active" | "completed" | "archived"
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
      response_status: "in_progress" | "completed" | "validated" | "flagged"
      signature_type:
        | "electronic"
        | "digital"
        | "wet_signature"
        | "api_signature"
      tenant_plan: "starter" | "professional" | "enterprise"
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
      response_status: ["in_progress", "completed", "validated", "flagged"],
      signature_type: [
        "electronic",
        "digital",
        "wet_signature",
        "api_signature",
      ],
      tenant_plan: ["starter", "professional", "enterprise"],
      user_role: ["admin", "manager", "technician"],
    },
  },
} as const
