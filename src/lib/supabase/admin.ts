import { createClient } from "@supabase/supabase-js";

// HANYA untuk server (API route). Jangan diimpor dari komponen client.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
