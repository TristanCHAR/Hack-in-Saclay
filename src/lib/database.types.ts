// This file is auto-generated from your Supabase schema
// Run: npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/database.types.ts

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
            profiles: {
                Row: {
                    id: string
                    email: string
                    full_name: string | null
                    role: 'parent' | 'caregiver' | 'neurologist'
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    email: string
                    full_name?: string | null
                    role?: 'parent' | 'caregiver' | 'neurologist'
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    email?: string
                    full_name?: string | null
                    role?: 'parent' | 'caregiver' | 'neurologist'
                    created_at?: string
                    updated_at?: string
                }
            }
            workspaces: {
                Row: {
                    id: string
                    name: string
                    invite_code: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    invite_code?: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    invite_code?: string
                    created_at?: string
                }
            }
            workspace_members: {
                Row: {
                    id: string
                    workspace_id: string
                    user_id: string
                    role: 'owner' | 'parent' | 'caregiver' | 'neurologist'
                    created_at: string
                }
                Insert: {
                    id?: string
                    workspace_id: string
                    user_id: string
                    role: 'owner' | 'parent' | 'caregiver' | 'neurologist'
                    created_at?: string
                }
                Update: {
                    id?: string
                    workspace_id?: string
                    user_id?: string
                    role?: 'owner' | 'parent' | 'caregiver' | 'neurologist'
                    created_at?: string
                }
            }
            children: {
                Row: {
                    id: string
                    workspace_id: string
                    name: string
                    birth_date: string
                    avatar_config: Json
                    epilepsy_profile: Json | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    workspace_id: string
                    name: string
                    birth_date: string
                    avatar_config?: Json
                    epilepsy_profile?: Json | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    workspace_id?: string
                    name?: string
                    birth_date?: string
                    avatar_config?: Json
                    epilepsy_profile?: Json | null
                    created_at?: string
                }
            }
            game_sessions: {
                Row: {
                    id: string
                    child_id: string
                    game_id: string
                    started_at: string
                    completed_at: string | null
                    score: number | null
                    metrics: Json | null
                    is_diagnostic: boolean
                }
                Insert: {
                    id?: string
                    child_id: string
                    game_id: string
                    started_at?: string
                    completed_at?: string | null
                    score?: number | null
                    metrics?: Json | null
                    is_diagnostic?: boolean
                }
                Update: {
                    id?: string
                    child_id?: string
                    game_id?: string
                    started_at?: string
                    completed_at?: string | null
                    score?: number | null
                    metrics?: Json | null
                    is_diagnostic?: boolean
                }
            }
            cognitive_scores: {
                Row: {
                    id: string
                    child_id: string
                    faculty: string
                    score: number
                    session_id: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    child_id: string
                    faculty: string
                    score: number
                    session_id: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    child_id?: string
                    faculty?: string
                    score?: number
                    session_id?: string
                    created_at?: string
                }
            }
            neurologist_settings: {
                Row: {
                    id: string
                    child_id: string
                    neurologist_id: string
                    enabled_games: Json
                    notes: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    child_id: string
                    neurologist_id: string
                    enabled_games?: Json
                    notes?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    child_id?: string
                    neurologist_id?: string
                    enabled_games?: Json
                    notes?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
        }
    }
}
