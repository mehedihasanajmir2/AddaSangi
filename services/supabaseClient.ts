
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

// Your provided Supabase project credentials
const supabaseUrl = 'https://qcljefpwkgofbwwrrkpf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjbGplZnB3a2dvZmJ3d3Jya3BmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNjkzMTQsImV4cCI6MjA4Njc0NTMxNH0.X66yO9YWvojY44EJVXm1cJFZktMjITBD_cDkXNLm3tU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
