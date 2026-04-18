export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          nombre: string | null
          apellido: string | null
          empresa: string | null
          whatsapp: string | null
          slug: string | null
          avatar_url: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      leads: {
        Row: {
          id: string
          vendedor_id: string
          nombre: string
          whatsapp: string
          producto: string | null
          plan: string | null
          fuente: string
          slug_origen: string | null
          etapa: string | null
          notas: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['leads']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['leads']['Insert']>
      }
      landing_config: {
        Row: {
          id: string
          vendedor_id: string
          titulo: string | null
          subtitulo: string | null
          producto: string | null
          color_acento: string | null
          foto_url: string | null
          whatsapp: string | null
          mensaje_wa: string | null
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['landing_config']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['landing_config']['Insert']>
      }
      productos: {
        Row: {
          id: string
          vendedor_id: string
          nombre: string
          precio: string | null
          descripcion: string | null
          orden: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['productos']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['productos']['Insert']>
      }
      suscripciones: {
        Row: {
          id: string
          vendedor_id: string
          plan: string
          estado: string
          periodo: string
          monto: number
          wompi_ref: string | null
          trial_ends_at: string | null
          current_period_start: string | null
          current_period_end: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['suscripciones']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['suscripciones']['Insert']>
      }
      admins: {
        Row: { id: string; email: string; created_at: string }
        Insert: Omit<Database['public']['Tables']['admins']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['admins']['Insert']>
      }
    }
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Lead = Database['public']['Tables']['leads']['Row']
export type LandingConfig = Database['public']['Tables']['landing_config']['Row']
export type Producto = Database['public']['Tables']['productos']['Row']
export type Suscripcion = Database['public']['Tables']['suscripciones']['Row']
