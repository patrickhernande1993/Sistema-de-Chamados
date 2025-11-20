import { createClient } from '@supabase/supabase-js';

// Uso seguro de import.meta.env com verificação de existência.
// Mantemos as chaves hardcoded como fallback para garantir o funcionamento imediato da demo.

const supabaseUrl = (import.meta.env && import.meta.env.VITE_SUPABASE_URL) || "https://nhvuwtmlftrdtpdolstg.supabase.co";
const supabaseKey = (import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5odnV3dG1sZnRyZHRwZG9sc3RnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzNDYwNjksImV4cCI6MjA3ODkyMjA2OX0.R02jwfweyL6LD_ftB5m1DtnmH5TbUddqtXZxhLh8Ulg";

if (!supabaseUrl || !supabaseKey) {
    console.error("Supabase URLs ausentes.");
}

export const supabase = createClient(supabaseUrl, supabaseKey);