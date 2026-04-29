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
      acquirer_connections: {
        Row: {
          access_token: string | null
          account_number: string | null
          api_url: string
          branch_id: string | null
          client_id: string | null
          created_at: string
          description: string | null
          hmac_key: string | null
          id: string
          is_active: boolean
          logo_key: string | null
          methods: string[]
          name: string
          status: string
          updated_at: string
        }
        Insert: {
          access_token?: string | null
          account_number?: string | null
          api_url: string
          branch_id?: string | null
          client_id?: string | null
          created_at?: string
          description?: string | null
          hmac_key?: string | null
          id?: string
          is_active?: boolean
          logo_key?: string | null
          methods?: string[]
          name: string
          status?: string
          updated_at?: string
        }
        Update: {
          access_token?: string | null
          account_number?: string | null
          api_url?: string
          branch_id?: string | null
          client_id?: string | null
          created_at?: string
          description?: string | null
          hmac_key?: string | null
          id?: string
          is_active?: boolean
          logo_key?: string | null
          methods?: string[]
          name?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      acquirer_costs: {
        Row: {
          acquirer_id: string
          created_at: string
          fixed_cost: number
          id: string
          method: string
          min_cost: number
          operation_type: string
          updated_at: string
          variable_cost: number
        }
        Insert: {
          acquirer_id: string
          created_at?: string
          fixed_cost?: number
          id?: string
          method: string
          min_cost?: number
          operation_type: string
          updated_at?: string
          variable_cost?: number
        }
        Update: {
          acquirer_id?: string
          created_at?: string
          fixed_cost?: number
          id?: string
          method?: string
          min_cost?: number
          operation_type?: string
          updated_at?: string
          variable_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "acquirer_costs_acquirer_id_fkey"
            columns: ["acquirer_id"]
            isOneToOne: false
            referencedRelation: "acquirer_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      api_keys: {
        Row: {
          api_key: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          permissions: string[]
          seller_id: string
          updated_at: string
        }
        Insert: {
          api_key: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          permissions?: string[]
          seller_id: string
          updated_at?: string
        }
        Update: {
          api_key?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          permissions?: string[]
          seller_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      api_routes: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          method: string
          name: string
          path: string
          rate_limit: number
          target_url: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          method: string
          name: string
          path: string
          rate_limit?: number
          target_url: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          method?: string
          name?: string
          path?: string
          rate_limit?: number
          target_url?: string
          updated_at?: string
        }
        Relationships: []
      }
      authorized_ips: {
        Row: {
          created_at: string
          id: string
          ip_address: string
          seller_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          ip_address: string
          seller_id: string
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: string
          seller_id?: string
        }
        Relationships: []
      }
      banners: {
        Row: {
          created_at: string
          display_order: number
          id: string
          image_url: string
          is_active: boolean
          link_url: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          image_url: string
          is_active?: boolean
          link_url?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string
          is_active?: boolean
          link_url?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      crm_settings: {
        Row: {
          api_token: string
          api_url: string
          created_at: string
          id: string
          instance_name: string
          is_active: boolean
          updated_at: string
          welcome_message: string
        }
        Insert: {
          api_token?: string
          api_url?: string
          created_at?: string
          id?: string
          instance_name?: string
          is_active?: boolean
          updated_at?: string
          welcome_message?: string
        }
        Update: {
          api_token?: string
          api_url?: string
          created_at?: string
          id?: string
          instance_name?: string
          is_active?: boolean
          updated_at?: string
          welcome_message?: string
        }
        Relationships: []
      }
      gateway_logs: {
        Row: {
          created_at: string
          duration_ms: number | null
          id: string
          level: string
          message: string
          route_id: string | null
          source: string | null
          status_code: number | null
          transaction_id: string | null
        }
        Insert: {
          created_at?: string
          duration_ms?: number | null
          id?: string
          level?: string
          message: string
          route_id?: string | null
          source?: string | null
          status_code?: number | null
          transaction_id?: string | null
        }
        Update: {
          created_at?: string
          duration_ms?: number | null
          id?: string
          level?: string
          message?: string
          route_id?: string | null
          source?: string | null
          status_code?: number | null
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gateway_logs_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "api_routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gateway_logs_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      gateway_routing_rules: {
        Row: {
          acquirer_id: string
          created_at: string
          id: string
          is_active: boolean
          method: string
          priority: number
          updated_at: string
          weight: number
        }
        Insert: {
          acquirer_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          method: string
          priority?: number
          updated_at?: string
          weight?: number
        }
        Update: {
          acquirer_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          method?: string
          priority?: number
          updated_at?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "gateway_routing_rules_acquirer_id_fkey"
            columns: ["acquirer_id"]
            isOneToOne: false
            referencedRelation: "acquirer_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      gateway_theme: {
        Row: {
          accent_color: string
          accent_foreground: string
          background_color: string
          border_color: string
          card_color: string
          card_foreground: string
          created_at: string
          dark_accent_color: string
          dark_accent_foreground: string
          dark_background_color: string
          dark_border_color: string
          dark_card_color: string
          dark_card_foreground: string
          dark_foreground_color: string
          dark_muted_color: string
          dark_muted_foreground: string
          dark_primary_color: string
          destructive_color: string
          foreground_color: string
          id: string
          muted_color: string
          muted_foreground: string
          primary_color: string
          primary_foreground: string
          success_color: string
          updated_at: string
          warning_color: string
        }
        Insert: {
          accent_color?: string
          accent_foreground?: string
          background_color?: string
          border_color?: string
          card_color?: string
          card_foreground?: string
          created_at?: string
          dark_accent_color?: string
          dark_accent_foreground?: string
          dark_background_color?: string
          dark_border_color?: string
          dark_card_color?: string
          dark_card_foreground?: string
          dark_foreground_color?: string
          dark_muted_color?: string
          dark_muted_foreground?: string
          dark_primary_color?: string
          destructive_color?: string
          foreground_color?: string
          id?: string
          muted_color?: string
          muted_foreground?: string
          primary_color?: string
          primary_foreground?: string
          success_color?: string
          updated_at?: string
          warning_color?: string
        }
        Update: {
          accent_color?: string
          accent_foreground?: string
          background_color?: string
          border_color?: string
          card_color?: string
          card_foreground?: string
          created_at?: string
          dark_accent_color?: string
          dark_accent_foreground?: string
          dark_background_color?: string
          dark_border_color?: string
          dark_card_color?: string
          dark_card_foreground?: string
          dark_foreground_color?: string
          dark_muted_color?: string
          dark_muted_foreground?: string
          dark_primary_color?: string
          destructive_color?: string
          foreground_color?: string
          id?: string
          muted_color?: string
          muted_foreground?: string
          primary_color?: string
          primary_foreground?: string
          success_color?: string
          updated_at?: string
          warning_color?: string
        }
        Relationships: []
      }
      global_fees: {
        Row: {
          boleto_fixed_fee: number
          boleto_min_fee: number
          boleto_retention_days: number
          boleto_retention_fee: number
          boleto_variable_fee: number
          card_fixed_fee: number
          card_min_fee: number
          card_retention_days: number
          card_retention_fee: number
          card_variable_fee: number
          created_at: string
          crypto_fixed_fee: number
          crypto_min_fee: number
          crypto_retention_days: number
          crypto_retention_fee: number
          crypto_variable_fee: number
          id: string
          pix_fixed_fee: number
          pix_min_fee: number
          pix_retention_days: number
          pix_retention_fee: number
          pix_variable_fee: number
          updated_at: string
          withdrawal_daily_max: number
          withdrawal_fixed_fee: number
          withdrawal_max_amount: number
          withdrawal_min_amount: number
          withdrawal_min_fee: number
          withdrawal_variable_fee: number
        }
        Insert: {
          boleto_fixed_fee?: number
          boleto_min_fee?: number
          boleto_retention_days?: number
          boleto_retention_fee?: number
          boleto_variable_fee?: number
          card_fixed_fee?: number
          card_min_fee?: number
          card_retention_days?: number
          card_retention_fee?: number
          card_variable_fee?: number
          created_at?: string
          crypto_fixed_fee?: number
          crypto_min_fee?: number
          crypto_retention_days?: number
          crypto_retention_fee?: number
          crypto_variable_fee?: number
          id?: string
          pix_fixed_fee?: number
          pix_min_fee?: number
          pix_retention_days?: number
          pix_retention_fee?: number
          pix_variable_fee?: number
          updated_at?: string
          withdrawal_daily_max?: number
          withdrawal_fixed_fee?: number
          withdrawal_max_amount?: number
          withdrawal_min_amount?: number
          withdrawal_min_fee?: number
          withdrawal_variable_fee?: number
        }
        Update: {
          boleto_fixed_fee?: number
          boleto_min_fee?: number
          boleto_retention_days?: number
          boleto_retention_fee?: number
          boleto_variable_fee?: number
          card_fixed_fee?: number
          card_min_fee?: number
          card_retention_days?: number
          card_retention_fee?: number
          card_variable_fee?: number
          created_at?: string
          crypto_fixed_fee?: number
          crypto_min_fee?: number
          crypto_retention_days?: number
          crypto_retention_fee?: number
          crypto_variable_fee?: number
          id?: string
          pix_fixed_fee?: number
          pix_min_fee?: number
          pix_retention_days?: number
          pix_retention_fee?: number
          pix_variable_fee?: number
          updated_at?: string
          withdrawal_daily_max?: number
          withdrawal_fixed_fee?: number
          withdrawal_max_amount?: number
          withdrawal_min_amount?: number
          withdrawal_min_fee?: number
          withdrawal_variable_fee?: number
        }
        Relationships: []
      }
      kyc_submissions: {
        Row: {
          address_status: string
          bank_data: Json | null
          bank_status: string
          business_activity: string | null
          city: string
          cnpj: string | null
          company_contract_url: string | null
          company_name: string | null
          company_type: string | null
          complement: string | null
          cpf: string | null
          created_at: string
          date_of_birth: string | null
          document_back_url: string | null
          document_front_url: string | null
          documents_review: Json
          documents_status: string
          email: string | null
          full_name: string
          id: string
          is_banned: boolean
          monthly_revenue: string | null
          neighborhood: string
          number: string
          person_type: Database["public"]["Enums"]["person_type"]
          phone: string | null
          proof_of_address_url: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          selfie_url: string | null
          state: string
          status: Database["public"]["Enums"]["kyc_status"]
          street: string
          trading_name: string | null
          updated_at: string
          user_id: string
          withdrawal_block_reason: string | null
          withdrawals_blocked: boolean
          zip_code: string
        }
        Insert: {
          address_status?: string
          bank_data?: Json | null
          bank_status?: string
          business_activity?: string | null
          city: string
          cnpj?: string | null
          company_contract_url?: string | null
          company_name?: string | null
          company_type?: string | null
          complement?: string | null
          cpf?: string | null
          created_at?: string
          date_of_birth?: string | null
          document_back_url?: string | null
          document_front_url?: string | null
          documents_review?: Json
          documents_status?: string
          email?: string | null
          full_name: string
          id?: string
          is_banned?: boolean
          monthly_revenue?: string | null
          neighborhood: string
          number: string
          person_type: Database["public"]["Enums"]["person_type"]
          phone?: string | null
          proof_of_address_url?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          selfie_url?: string | null
          state: string
          status?: Database["public"]["Enums"]["kyc_status"]
          street: string
          trading_name?: string | null
          updated_at?: string
          user_id: string
          withdrawal_block_reason?: string | null
          withdrawals_blocked?: boolean
          zip_code: string
        }
        Update: {
          address_status?: string
          bank_data?: Json | null
          bank_status?: string
          business_activity?: string | null
          city?: string
          cnpj?: string | null
          company_contract_url?: string | null
          company_name?: string | null
          company_type?: string | null
          complement?: string | null
          cpf?: string | null
          created_at?: string
          date_of_birth?: string | null
          document_back_url?: string | null
          document_front_url?: string | null
          documents_review?: Json
          documents_status?: string
          email?: string | null
          full_name?: string
          id?: string
          is_banned?: boolean
          monthly_revenue?: string | null
          neighborhood?: string
          number?: string
          person_type?: Database["public"]["Enums"]["person_type"]
          phone?: string | null
          proof_of_address_url?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          selfie_url?: string | null
          state?: string
          status?: Database["public"]["Enums"]["kyc_status"]
          street?: string
          trading_name?: string | null
          updated_at?: string
          user_id?: string
          withdrawal_block_reason?: string | null
          withdrawals_blocked?: boolean
          zip_code?: string
        }
        Relationships: []
      }
      login_logs: {
        Row: {
          created_at: string
          id: string
          ip_address: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          ip_address: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_id: string
          avatar_url: string | null
          created_at: string
          email: string | null
          email_manually_approved: boolean
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id?: string
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          email_manually_approved?: boolean
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          email_manually_approved?: boolean
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          action: string
          attempts: number
          blocked_until: string | null
          first_attempt_at: string
          id: string
          ip_address: string
          last_attempt_at: string
        }
        Insert: {
          action?: string
          attempts?: number
          blocked_until?: string | null
          first_attempt_at?: string
          id?: string
          ip_address: string
          last_attempt_at?: string
        }
        Update: {
          action?: string
          attempts?: number
          blocked_until?: string | null
          first_attempt_at?: string
          id?: string
          ip_address?: string
          last_attempt_at?: string
        }
        Relationships: []
      }
      recovery_codes: {
        Row: {
          code: string
          created_at: string
          email: string
          expires_at: string
          id: string
          used: boolean
        }
        Insert: {
          code: string
          created_at?: string
          email: string
          expires_at: string
          id?: string
          used?: boolean
        }
        Update: {
          code?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          used?: boolean
        }
        Relationships: []
      }
      refund_requests: {
        Row: {
          admin_note: string | null
          amount: number
          created_at: string
          id: string
          reason: string
          reviewed_at: string | null
          reviewed_by: string | null
          seller_id: string
          status: Database["public"]["Enums"]["refund_status"]
          transaction_id: string
          updated_at: string
        }
        Insert: {
          admin_note?: string | null
          amount: number
          created_at?: string
          id?: string
          reason: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          seller_id: string
          status?: Database["public"]["Enums"]["refund_status"]
          transaction_id: string
          updated_at?: string
        }
        Update: {
          admin_note?: string | null
          amount?: number
          created_at?: string
          id?: string
          reason?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          seller_id?: string
          status?: Database["public"]["Enums"]["refund_status"]
          transaction_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "refund_requests_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_fees: {
        Row: {
          billing_goal: number
          boleto_fixed_fee: number
          boleto_min_fee: number
          boleto_retention_days: number
          boleto_retention_fee: number
          boleto_variable_fee: number
          card_fixed_fee: number
          card_min_fee: number
          card_retention_days: number
          card_retention_fee: number
          card_variable_fee: number
          created_at: string
          crypto_fixed_fee: number
          crypto_min_fee: number
          crypto_retention_days: number
          crypto_retention_fee: number
          crypto_variable_fee: number
          id: string
          pix_fixed_fee: number
          pix_min_fee: number
          pix_retention_days: number
          pix_retention_fee: number
          pix_variable_fee: number
          seller_id: string
          updated_at: string
          withdrawal_daily_max: number
          withdrawal_fixed_fee: number
          withdrawal_max_amount: number
          withdrawal_min_amount: number
          withdrawal_min_fee: number
          withdrawal_variable_fee: number
        }
        Insert: {
          billing_goal?: number
          boleto_fixed_fee?: number
          boleto_min_fee?: number
          boleto_retention_days?: number
          boleto_retention_fee?: number
          boleto_variable_fee?: number
          card_fixed_fee?: number
          card_min_fee?: number
          card_retention_days?: number
          card_retention_fee?: number
          card_variable_fee?: number
          created_at?: string
          crypto_fixed_fee?: number
          crypto_min_fee?: number
          crypto_retention_days?: number
          crypto_retention_fee?: number
          crypto_variable_fee?: number
          id?: string
          pix_fixed_fee?: number
          pix_min_fee?: number
          pix_retention_days?: number
          pix_retention_fee?: number
          pix_variable_fee?: number
          seller_id: string
          updated_at?: string
          withdrawal_daily_max?: number
          withdrawal_fixed_fee?: number
          withdrawal_max_amount?: number
          withdrawal_min_amount?: number
          withdrawal_min_fee?: number
          withdrawal_variable_fee?: number
        }
        Update: {
          billing_goal?: number
          boleto_fixed_fee?: number
          boleto_min_fee?: number
          boleto_retention_days?: number
          boleto_retention_fee?: number
          boleto_variable_fee?: number
          card_fixed_fee?: number
          card_min_fee?: number
          card_retention_days?: number
          card_retention_fee?: number
          card_variable_fee?: number
          created_at?: string
          crypto_fixed_fee?: number
          crypto_min_fee?: number
          crypto_retention_days?: number
          crypto_retention_fee?: number
          crypto_variable_fee?: number
          id?: string
          pix_fixed_fee?: number
          pix_min_fee?: number
          pix_retention_days?: number
          pix_retention_fee?: number
          pix_variable_fee?: number
          seller_id?: string
          updated_at?: string
          withdrawal_daily_max?: number
          withdrawal_fixed_fee?: number
          withdrawal_max_amount?: number
          withdrawal_min_amount?: number
          withdrawal_min_fee?: number
          withdrawal_variable_fee?: number
        }
        Relationships: []
      }
      seller_goal_progress: {
        Row: {
          completed_at: string | null
          created_at: string
          current_value: number
          goal_id: string
          id: string
          is_completed: boolean
          reward_claimed: boolean
          seller_id: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          current_value?: number
          goal_id: string
          id?: string
          is_completed?: boolean
          reward_claimed?: boolean
          seller_id: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          current_value?: number
          goal_id?: string
          id?: string
          is_completed?: boolean
          reward_claimed?: boolean
          seller_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_goal_progress_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "seller_goals"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_goals: {
        Row: {
          created_at: string
          description: string | null
          end_date: string | null
          goal_type: Database["public"]["Enums"]["goal_type"]
          id: string
          is_active: boolean
          reward_description: string | null
          reward_type: Database["public"]["Enums"]["reward_type"]
          reward_value: number
          seller_id: string | null
          start_date: string
          target_value: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          goal_type?: Database["public"]["Enums"]["goal_type"]
          id?: string
          is_active?: boolean
          reward_description?: string | null
          reward_type?: Database["public"]["Enums"]["reward_type"]
          reward_value?: number
          seller_id?: string | null
          start_date?: string
          target_value: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          goal_type?: Database["public"]["Enums"]["goal_type"]
          id?: string
          is_active?: boolean
          reward_description?: string | null
          reward_type?: Database["public"]["Enums"]["reward_type"]
          reward_value?: number
          seller_id?: string | null
          start_date?: string
          target_value?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      smtp_settings: {
        Row: {
          created_at: string
          encryption: string
          from_email: string
          from_name: string
          host: string
          id: string
          is_active: boolean
          password: string
          port: number
          updated_at: string
          username: string
        }
        Insert: {
          created_at?: string
          encryption?: string
          from_email?: string
          from_name?: string
          host?: string
          id?: string
          is_active?: boolean
          password?: string
          port?: number
          updated_at?: string
          username?: string
        }
        Update: {
          created_at?: string
          encryption?: string
          from_email?: string
          from_name?: string
          host?: string
          id?: string
          is_active?: boolean
          password?: string
          port?: number
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          acquirer: string | null
          amount: number
          created_at: string
          currency: string
          customer_email: string | null
          customer_name: string
          description: string | null
          fee_amount: number
          id: string
          is_fake_refund: boolean
          is_locked: boolean
          lock_reason: string | null
          metadata: Json | null
          method: string
          net_amount: number
          pix_code: string | null
          refund_reason: string | null
          seller_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          acquirer?: string | null
          amount: number
          created_at?: string
          currency?: string
          customer_email?: string | null
          customer_name: string
          description?: string | null
          fee_amount?: number
          id?: string
          is_fake_refund?: boolean
          is_locked?: boolean
          lock_reason?: string | null
          metadata?: Json | null
          method: string
          net_amount?: number
          pix_code?: string | null
          refund_reason?: string | null
          seller_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          acquirer?: string | null
          amount?: number
          created_at?: string
          currency?: string
          customer_email?: string | null
          customer_name?: string
          description?: string | null
          fee_amount?: number
          id?: string
          is_fake_refund?: boolean
          is_locked?: boolean
          lock_reason?: string | null
          metadata?: Json | null
          method?: string
          net_amount?: number
          pix_code?: string | null
          refund_reason?: string | null
          seller_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      cleanup_old_rate_limits: { Args: never; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "seller"
      goal_type:
        | "revenue"
        | "transaction_count"
        | "avg_ticket"
        | "new_customers"
      kyc_status: "pending" | "under_review" | "approved" | "rejected"
      person_type: "pf" | "pj"
      refund_status: "pending" | "approved" | "rejected"
      reward_type: "balance_bonus" | "fee_discount" | "badge" | "custom"
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
      app_role: ["admin", "seller"],
      goal_type: [
        "revenue",
        "transaction_count",
        "avg_ticket",
        "new_customers",
      ],
      kyc_status: ["pending", "under_review", "approved", "rejected"],
      person_type: ["pf", "pj"],
      refund_status: ["pending", "approved", "rejected"],
      reward_type: ["balance_bonus", "fee_discount", "badge", "custom"],
    },
  },
} as const
