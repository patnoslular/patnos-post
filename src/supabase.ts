import { createClient } from '@supabase/supabase-js';

// Vercel ve Yerel ortamlar için değişkenler
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://luphjhodlrnnnnbmwzad.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1cGhqaG9kbHJubm5uYm13emFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1NjAxNTUsImV4cCI6MjA4OTEzNjE1NX0.jpqt-fKdWBIat5sKB7ep78N8U4Ndg_5ZjsyxdczIW4A';
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1cGhqaG9kbHJubm5uYm13emFkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzU2MDE1NSwiZXhwIjoyMDg5MTM2MTU1fQ.S-pTf8rkpD9AG5331DYEjROM7hXJB5cAWI-lLUz1NZ8';

export const getSupabaseConfig = () => {
  return { 
    url: supabaseUrl, 
    anonKey: supabaseAnonKey, 
    serviceKey: supabaseServiceKey 
  };
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const isSupabaseConfigured = () => Boolean(supabaseUrl && supabaseAnonKey);
