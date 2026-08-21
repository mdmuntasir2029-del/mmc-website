/**
 * Auth, backed by Supabase Auth. Who counts as an admin is controlled by
 * the `admins` table in Supabase (see supabase/schema.sql) — add or
 * remove an admin with a SQL statement there, no code change or redeploy
 * needed. is_admin() is a SECURITY DEFINER function so the client can
 * check membership without the `admins` table itself ever being
 * readable through the API.
 */
import { supabase } from "./supabaseClient";

export async function signIn(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

export async function checkIsAdmin(): Promise<boolean> {
  const { data, error } = await supabase.rpc("is_admin");
  if (error) return false;
  return data === true;
}
