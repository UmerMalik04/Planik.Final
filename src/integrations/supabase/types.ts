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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      completed_exercises: {
        Row: {
          date: string
          id: string
          name: string
          previous_reps: number | null
          previous_set_data: Json | null
          previous_weight: number | null
          reps: number
          session_id: string
          set_data: Json | null
          sets: number
          user_id: string
          weight: number
        }
        Insert: {
          date?: string
          id?: string
          name: string
          previous_reps?: number | null
          previous_set_data?: Json | null
          previous_weight?: number | null
          reps: number
          session_id: string
          set_data?: Json | null
          sets: number
          user_id: string
          weight: number
        }
        Update: {
          date?: string
          id?: string
          name?: string
          previous_reps?: number | null
          previous_set_data?: Json | null
          previous_weight?: number | null
          reps?: number
          session_id?: string
          set_data?: Json | null
          sets?: number
          user_id?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "completed_exercises_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          created_at: string
          has_warmup: boolean | null
          id: string
          name: string
          plan_id: string
          reps: number
          sets: number
          user_id: string
          weight: number | null
        }
        Insert: {
          created_at?: string
          has_warmup?: boolean | null
          id?: string
          name: string
          plan_id: string
          reps: number
          sets: number
          user_id: string
          weight?: number | null
        }
        Update: {
          created_at?: string
          has_warmup?: boolean | null
          id?: string
          name?: string
          plan_id?: string
          reps?: number
          sets?: number
          user_id?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "exercises_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "workout_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      food_items: {
        Row: {
          calories: number
          carbs: number
          created_at: string
          date: string
          fat: number
          fiber: number
          id: string
          name: string
          protein: number
          quantity: number
          sugar: number
          unit: string
          user_id: string
        }
        Insert: {
          calories: number
          carbs: number
          created_at?: string
          date: string
          fat: number
          fiber: number
          id?: string
          name: string
          protein: number
          quantity: number
          sugar: number
          unit: string
          user_id: string
        }
        Update: {
          calories?: number
          carbs?: number
          created_at?: string
          date?: string
          fat?: number
          fiber?: number
          id?: string
          name?: string
          protein?: number
          quantity?: number
          sugar?: number
          unit?: string
          user_id?: string
        }
        Relationships: []
      }
      personal_records: {
        Row: {
          date: string
          exercise_name: string
          id: string
          reps: number
          user_id: string
          weight: number
        }
        Insert: {
          date?: string
          exercise_name: string
          id?: string
          reps: number
          user_id: string
          weight: number
        }
        Update: {
          date?: string
          exercise_name?: string
          id?: string
          reps?: number
          user_id?: string
          weight?: number
        }
        Relationships: []
      }
      user_goals: {
        Row: {
          created_at: string
          daily_calorie_target: number | null
          daily_protein_target: number | null
          id: string
          start_date: string
          target_date: string | null
          target_weight: number | null
          updated_at: string
          user_id: string
          weekly_workout_frequency: number | null
        }
        Insert: {
          created_at?: string
          daily_calorie_target?: number | null
          daily_protein_target?: number | null
          id?: string
          start_date?: string
          target_date?: string | null
          target_weight?: number | null
          updated_at?: string
          user_id: string
          weekly_workout_frequency?: number | null
        }
        Update: {
          created_at?: string
          daily_calorie_target?: number | null
          daily_protein_target?: number | null
          id?: string
          start_date?: string
          target_date?: string | null
          target_weight?: number | null
          updated_at?: string
          user_id?: string
          weekly_workout_frequency?: number | null
        }
        Relationships: []
      }
      user_stats: {
        Row: {
          current_streak: number | null
          last_week_progress: number | null
          last_workout_date: string | null
          progress_kg: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          current_streak?: number | null
          last_week_progress?: number | null
          last_workout_date?: string | null
          progress_kg?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          current_streak?: number | null
          last_week_progress?: number | null
          last_workout_date?: string | null
          progress_kg?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      workout_plans: {
        Row: {
          created_at: string
          id: string
          name: string
          sets: number
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          sets?: number
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          sets?: number
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      workout_sessions: {
        Row: {
          created_at: string
          date: string
          id: string
          is_active: boolean | null
          plan_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          is_active?: boolean | null
          plan_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          is_active?: boolean | null
          plan_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_sessions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "workout_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_types: {
        Row: {
          color: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          color: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          color?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
  public: {
    Enums: {},
  },
} as const
