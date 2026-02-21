import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client - single instance to avoid multiple GoTrueClient instances
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables in .env file');
}

// Create a single instance of the Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Log to confirm successful connection
console.log('✅ Supabase client initialized');

// Export named and default to support both import styles
export { supabase };
export default supabase;