// Ruta destino: src/types/database.ts
// REEMPLAZA el archivo completo. Cambios:
// - Suscripciones: nuevo schema (fecha_inicio, fecha_fin, sin wompi/period)
// - Agrega tabla "pagos"

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
          industria: string | null
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
          imagen_hero: string | null
          hero_video_url: string | null
          imagen_logo: string | null
          imagenes_galeria: string[] | null
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
          imagen_principal: string | null
          imagenes_adicionales: string[] | null
        }
        Insert: Omit<Database['public']['Tables']['productos']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['productos']['Insert']>
      }
      suscripciones: {
        Row: {
          id: string
          vendedor_id: string
          plan: string                  // 'trial' | 'starter' | 'pro' | 'enterprise'
          estado: string                // 'activa' | 'vencida' | 'cancelada' | 'pausada'
          periodo: string               // 'mensual' | 'anual' | 'trial'
          fecha_inicio: string
          fecha_fin: string             // ← antes era trial_ends_at
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['suscripciones']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['suscripciones']['Insert']>
      }
      pagos: {
        Row: {
          id: string
          vendedor_id: string
          suscripcion_id: string | null
          plan: string
          periodo: string
          monto: number
          comprobante_url: string | null
          comprobante_storage_path: string | null
          estado: string                // 'pendiente' | 'aprobado' | 'rechazado'
          motivo_rechazo: string | null
          notas_admin: string | null
          notas_vendedor: string | null
          aprobado_por: string | null
          aprobado_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['pagos']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['pagos']['Insert']>
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
export type Pago = Database['public']['Tables']['pagos']['Row']
