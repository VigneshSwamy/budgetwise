// Database type definitions will be generated from Supabase schema
// This file is a placeholder for future type generation

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      // Tables will be defined here after schema migration
    }
    Views: {
      // Views will be defined here after schema migration
    }
    Functions: {
      // RPC functions will be defined here
    }
  }
}