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
      app_setting: {
        Row: {
          created_at: string
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          setting_key: string
          setting_value?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string
        }
        Relationships: []
      }
      app_state: {
        Row: {
          id: string
          key: string
          updated_at: string | null
          user_id: string
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string | null
          user_id: string
          value?: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string | null
          user_id?: string
          value?: Json
        }
        Relationships: []
      }
      assignment: {
        Row: {
          assigned_user_id: string | null
          assigned_user_name: string | null
          assignment_name: string
          completed_exercises: Json
          created_at: string
          id: string
          plan_id: string
          plan_items: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_user_id?: string | null
          assigned_user_name?: string | null
          assignment_name: string
          completed_exercises?: Json
          created_at?: string
          id?: string
          plan_id: string
          plan_items?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_user_id?: string | null
          assigned_user_name?: string | null
          assignment_name?: string
          completed_exercises?: Json
          created_at?: string
          id?: string
          plan_id?: string
          plan_items?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gym_pilot_assignment_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "gym_pilot_plan"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          created_at: string
          details: Json | null
          id: string
          message: string
        }
        Insert: {
          created_at?: string
          details?: Json | null
          id?: string
          message: string
        }
        Update: {
          created_at?: string
          details?: Json | null
          id?: string
          message?: string
        }
        Relationships: []
      }
      error_log: {
        Row: {
          created_at: string
          details: Json | null
          id: string
          message: string
        }
        Insert: {
          created_at?: string
          details?: Json | null
          id?: string
          message: string
        }
        Update: {
          created_at?: string
          details?: Json | null
          id?: string
          message?: string
        }
        Relationships: []
      }
      favourite: {
        Row: {
          created_at: string
          folder: string | null
          folder_id: string | null
          id: string
          label: string
          path: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          folder?: string | null
          folder_id?: string | null
          id?: string
          label: string
          path: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          folder?: string | null
          folder_id?: string | null
          id?: string
          label?: string
          path?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gym_pilot_favourite_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "favourite_folder"
            referencedColumns: ["id"]
          },
        ]
      }
      favourite_folder: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      gym_pilot_plan: {
        Row: {
          created_at: string
          id: string
          plan_name: string
          plan_sessions: Json
          plan_slug: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          plan_name: string
          plan_sessions?: Json
          plan_slug: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          plan_name?: string
          plan_sessions?: Json
          plan_slug?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      gym_pilot_profile: {
        Row: {
          access_ends_at: string | null
          account_tier: string
          application_name: string | null
          created_at: string
          email: string | null
          friendly_name: string | null
          gym_brand: string | null
          gym_club_id: number | null
          gym_name: string | null
          id: string
          is_frozen: boolean
          last_logged_in_at: string | null
          must_change_password: boolean
          previous_last_logged_in_at: string | null
          terms_accepted: boolean
          terms_accepted_at: string | null
          trainer_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_ends_at?: string | null
          account_tier?: string
          application_name?: string | null
          created_at?: string
          email?: string | null
          friendly_name?: string | null
          gym_brand?: string | null
          gym_club_id?: number | null
          gym_name?: string | null
          id?: string
          is_frozen?: boolean
          last_logged_in_at?: string | null
          must_change_password?: boolean
          previous_last_logged_in_at?: string | null
          terms_accepted?: boolean
          terms_accepted_at?: string | null
          trainer_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_ends_at?: string | null
          account_tier?: string
          application_name?: string | null
          created_at?: string
          email?: string | null
          friendly_name?: string | null
          gym_brand?: string | null
          gym_club_id?: number | null
          gym_name?: string | null
          id?: string
          is_frozen?: boolean
          last_logged_in_at?: string | null
          must_change_password?: boolean
          previous_last_logged_in_at?: string | null
          terms_accepted?: boolean
          terms_accepted_at?: string | null
          trainer_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      gym_pilot_user_role: {
        Row: {
          created_at: string
          id: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      gym_pilot_user_session_workout_item: {
        Row: {
          category: string
          created_at: string | null
          distance_km: string | null
          duration_minutes: string | null
          exercise_id: string | null
          exercise_name: string | null
          id: string
          item_index: number
          notes: string | null
          plan_item_id: string | null
          reps: string | null
          session_id: string
          session_row_id: string | null
          sets: string | null
          sort_order: number | null
          speed_kph: string | null
          updated_at: string | null
          user_id: string
          weight: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          distance_km?: string | null
          duration_minutes?: string | null
          exercise_id?: string | null
          exercise_name?: string | null
          id?: string
          item_index: number
          notes?: string | null
          plan_item_id?: string | null
          reps?: string | null
          session_id: string
          session_row_id?: string | null
          sets?: string | null
          sort_order?: number | null
          speed_kph?: string | null
          updated_at?: string | null
          user_id: string
          weight?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          distance_km?: string | null
          duration_minutes?: string | null
          exercise_id?: string | null
          exercise_name?: string | null
          id?: string
          item_index?: number
          notes?: string | null
          plan_item_id?: string | null
          reps?: string | null
          session_id?: string
          session_row_id?: string | null
          sets?: string | null
          sort_order?: number | null
          speed_kph?: string | null
          updated_at?: string | null
          user_id?: string
          weight?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gym_pilot_user_session_workout_item_session_row_id_fkey"
            columns: ["session_row_id"]
            isOneToOne: false
            referencedRelation: "user_workout"
            referencedColumns: ["id"]
          },
        ]
      }
      imported_workout: {
        Row: {
          created_at: string
          display_name: string
          duration: number
          energy: number | null
          energy_unit: string | null
          id: string
          original_id: string | null
          session_id: string | null
          start_date: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name: string
          duration: number
          energy?: number | null
          energy_unit?: string | null
          id?: string
          original_id?: string | null
          session_id?: string | null
          start_date: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string
          duration?: number
          energy?: number | null
          energy_unit?: string | null
          id?: string
          original_id?: string | null
          session_id?: string | null
          start_date?: string
          user_id?: string
        }
        Relationships: []
      }
      user_activity: {
        Row: {
          created_at: string
          event_data: Json
          event_type: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_data?: Json
          event_type: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_data?: Json
          event_type?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_workout: {
        Row: {
          attendance_type: string | null
          capacity: number | null
          class_id: string | null
          class_name: string | null
          created_at: string | null
          duration_minutes: number | null
          energy: number | null
          energy_unit: string | null
          gym_club_id: number | null
          id: string
          location: string | null
          metadata: Json | null
          notes: string | null
          price: number | null
          rating: number | null
          role: string | null
          session_id: string | null
          session_type: string
          start_at: string
          status: string | null
          trainer_id: string | null
          trainer_name: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          attendance_type?: string | null
          capacity?: number | null
          class_id?: string | null
          class_name?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          energy?: number | null
          energy_unit?: string | null
          gym_club_id?: number | null
          id?: string
          location?: string | null
          metadata?: Json | null
          notes?: string | null
          price?: number | null
          rating?: number | null
          role?: string | null
          session_id?: string | null
          session_type: string
          start_at: string
          status?: string | null
          trainer_id?: string | null
          trainer_name?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          attendance_type?: string | null
          capacity?: number | null
          class_id?: string | null
          class_name?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          energy?: number | null
          energy_unit?: string | null
          gym_club_id?: number | null
          id?: string
          location?: string | null
          metadata?: Json | null
          notes?: string | null
          price?: number | null
          rating?: number | null
          role?: string | null
          session_id?: string | null
          session_type?: string
          start_at?: string
          status?: string | null
          trainer_id?: string | null
          trainer_name?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      user_has_role: {
        Args: { p_role: string; p_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
