/**
 * Admin auth, backed by Supabase Auth. There is exactly one privileged
 * account — create it once in Supabase Dashboard → Authentication → Users
 * (see supabase/schema.sql and the project README for the full setup).
 * RLS policies in schema.sql are the real enforcement; the email check
 * here is just for the sign-in form's messaging.
 */
import { supabase } from "./supabaseClient";

export const ADMIN_EMAIL = "mdmuntasir.2029@gmail.com";

export function isAdminEmail(email: string): boolean {
  return email.trim().toLowerCase() === ADMIN_EMAIL;
}

export async function signIn(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}
