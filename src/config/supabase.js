import { createClient } from "@supabase/supabase-js";
import { getEnv } from "./env.js";

const env = getEnv();

export const supabase = createClient(
  env.supabaseUrl,
  env.supabaseSecretKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
);
