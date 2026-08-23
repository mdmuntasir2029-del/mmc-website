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

/**
 * First-time account setup for an email already listed in `admins`.
 * Supabase's signUp() never overwrites an existing account's password —
 * it errors instead — so this can only ever "claim" an email once, not
 * reset one. With email confirmation disabled in the Supabase dashboard,
 * a successful call signs the browser in immediately.
 */
export async function claimAccount(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signUp({ email, password });
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
