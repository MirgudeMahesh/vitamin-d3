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
      camps: {
        Row: {
          adequate_patients: number | null
          camp_date: string
          consent_form_url: string | null
          created_at: string
          deksel_2k_syrup: number | null
          deksel_nano_syrup: number | null
          deksel_neo_syrup: number | null
          doctor_id: string
          id: string
          inadequate_patients: number | null
          rx_generated: number | null
          status: string
          total_patients: number | null
          units_sold: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          adequate_patients?: number | null
          camp_date: string
          consent_form_url?: string | null
          created_at?: string
          deksel_2k_syrup?: number | null
          deksel_nano_syrup?: number | null
          deksel_neo_syrup?: number | null
          doctor_id: string
          id?: string
          inadequate_patients?: number | null
          rx_generated?: number | null
          status?: string
          total_patients?: number | null
          units_sold?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          adequate_patients?: number | null
          camp_date?: string
          consent_form_url?: string | null
          created_at?: string
          deksel_2k_syrup?: number | null
          deksel_nano_syrup?: number | null
          deksel_neo_syrup?: number | null
          doctor_id?: string
          id?: string
          inadequate_patients?: number | null
          rx_generated?: number | null
          status?: string
          total_patients?: number | null
          units_sold?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "camps_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "camps_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      doctors: {
        Row: {
          city: string | null
          clinic_address: string | null
          clinic_name: string | null
          created_at: string
          id: string
          imacx_code: string
          is_selected_by_marketing: boolean | null
          name: string
          phone: string
          specialty: string | null
          updated_at: string
          whatsapp_number: string | null
        }
        Insert: {
          city?: string | null
          clinic_address?: string | null
          clinic_name?: string | null
          created_at?: string
          id?: string
          imacx_code: string
          is_selected_by_marketing?: boolean | null
          name: string
          phone: string
          specialty?: string | null
          updated_at?: string
          whatsapp_number?: string | null
        }
        Update: {
          city?: string | null
          clinic_address?: string | null
          clinic_name?: string | null
          created_at?: string
          id?: string
          imacx_code?: string
          is_selected_by_marketing?: boolean | null
          name?: string
          phone?: string
          specialty?: string | null
          updated_at?: string
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      patients: {
        Row: {
          age: number
          bmi: number | null
          camp_id: string
          created_at: string
          diabetes: boolean | null
          gender: string
          height_feet: number | null
          height_inches: number | null
          height_meters: number | null
          hypertension: boolean | null
          hyperthyroidism: boolean | null
          hypothyroidism: boolean | null
          id: string
          initials: string
          other_comorbidity: string | null
          patient_number: number
          questionnaire_responses: Json | null
          risk_level: string | null
          section_a_score: number | null
          section_b_score: number | null
          total_score: number | null
          updated_at: string
          weight_kg: number | null
        }
        Insert: {
          age: number
          bmi?: number | null
          camp_id: string
          created_at?: string
          diabetes?: boolean | null
          gender: string
          height_feet?: number | null
          height_inches?: number | null
          height_meters?: number | null
          hypertension?: boolean | null
          hyperthyroidism?: boolean | null
          hypothyroidism?: boolean | null
          id?: string
          initials: string
          other_comorbidity?: string | null
          patient_number: number
          questionnaire_responses?: Json | null
          risk_level?: string | null
          section_a_score?: number | null
          section_b_score?: number | null
          total_score?: number | null
          updated_at?: string
          weight_kg?: number | null
        }
        Update: {
          age?: number
          bmi?: number | null
          camp_id?: string
          created_at?: string
          diabetes?: boolean | null
          gender?: string
          height_feet?: number | null
          height_inches?: number | null
          height_meters?: number | null
          hypertension?: boolean | null
          hyperthyroidism?: boolean | null
          hypothyroidism?: boolean | null
          id?: string
          initials?: string
          other_comorbidity?: string | null
          patient_number?: number
          questionnaire_responses?: Json | null
          risk_level?: string | null
          section_a_score?: number | null
          section_b_score?: number | null
          total_score?: number | null
          updated_at?: string
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "patients_camp_id_fkey"
            columns: ["camp_id"]
            isOneToOne: false
            referencedRelation: "camps"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          email: string
          id: string
          imacx_id: string | null
          name: string
          phone: string | null
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          imacx_id?: string | null
          name: string
          phone?: string | null
          role: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          imacx_id?: string | null
          name?: string
          phone?: string | null
          role?: string
          updated_at?: string
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
      camp_status: "active" | "completed" | "cancelled"
      risk_level: "Low Risk" | "Moderate Risk" | "High Risk"
      user_role: "BE" | "BM" | "Marketing" | "Admin"
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
      camp_status: ["active", "completed", "cancelled"],
      risk_level: ["Low Risk", "Moderate Risk", "High Risk"],
      user_role: ["BE", "BM", "Marketing", "Admin"],
    },
  },
} as const
