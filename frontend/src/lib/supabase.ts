import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing env vars:', { supabaseUrl, supabaseAnonKey });
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      resumes: {
        Row: {
          id: string;
          user_id: string;
          file_name: string;
          file_url: string;
          parsed_data: Record<string, unknown>;
          created_at: string;
        };
      };
      applications: {
        Row: {
          id: string;
          user_id: string;
          job_title: string;
          company: string;
          status: string;
          created_at: string;
        };
      };
    };
  };
};