import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://nhvuwtmlftrdtpdolstg.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5odnV3dG1sZnRyZHRwZG9sc3RnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzNDYwNjksImV4cCI6MjA3ODkyMjA2OX0.R02jwfweyL6LD_ftB5m1DtnmH5TbUddqtXZxhLh8Ulg";

export const supabase = createClient(supabaseUrl, supabaseKey);
