import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase URL or Anon Key not found in environment variables');
}

// Ne pas utiliser le type Database car il bloque les inserts
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
