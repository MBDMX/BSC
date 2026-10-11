import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hteqspsufvevhnrilvbf.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0ZXFzcHN1ZnZldmhucmlsdmJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxNDE4NTIsImV4cCI6MjA4MjcxNzg1Mn0.ALEiZkHHwCaDRCBGCD28nIsgMkd5kT-pzXf7pscrvtE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
