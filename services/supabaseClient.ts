import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Supabase URLs ausentes. Verifique o arquivo .env");
}

export const supabase = createClient(supabaseUrl || '', supabaseKey || '');