import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    "Missing Supabase config. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY " +
      "in .env.local (see .env.example) and in your Vercel project's env vars."
  );
}

export const supabase = createClient(url, anonKey);

export const FILES_BUCKET = "mmc-files";
