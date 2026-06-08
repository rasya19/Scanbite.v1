import { createClient } from '@supabase/supabase-js';

const envUrl = (import.meta as any).env.VITE_SUPABASE_URL;
const isDeadUrl = envUrl && envUrl.includes('doojqpodbtqldkahaaua');
const REPLACEMENT_URL = 'https://czvmkobgqnasalsgqbeq.supabase.co';
const DEFAULT_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6dm1rb2JncW5hc2Fsc2dxYmVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3MzA5MTQsImV4cCI6MjA5NTMwNjkxNH0.50UTHuSIp9BTEC9xx6mWxu5xpAJKJyNw4A19Vl1tU8I';

const supabaseUrl = isDeadUrl ? REPLACEMENT_URL : (envUrl || REPLACEMENT_URL);
const supabaseAnonKey = isDeadUrl ? DEFAULT_ANON_KEY : ((import.meta as any).env.VITE_SUPABASE_ANON_KEY || DEFAULT_ANON_KEY);

// Centralized safe Supabase client with sandbox fallback
export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;
