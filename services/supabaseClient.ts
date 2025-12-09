import { createClient } from '@supabase/supabase-js';

// Uso seguro de import.meta.env com verificação de existência.
// As chaves fornecidas foram atualizadas como fallback.

const supabaseUrl = (import.meta.env && import.meta.env.VITE_SUPABASE_URL) || "https://ecpzelerubumjnxbewar.supabase.co";
const supabaseKey = (import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjcHplbGVydWJ1bWpueGJld2FyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzNTQ2ODQsImV4cCI6MjA3ODkzMDY4NH0.fqWN8baYCla8ftlrPWyVH-NiY6Vgi4e-WTYoWdZgVV0";

if (!supabaseUrl || !supabaseKey) {
    console.error("Supabase URLs ausentes.");
}

export const supabase = createClient(supabaseUrl, supabaseKey);