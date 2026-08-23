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
 * reset one. Returns true if the browser is signed in immediately
 * (email confirmation disabled) or false if a confirmation email was
 * sent instead (confirmation enabled) — the caller adapts to whichever
 * is currently configured rather than assuming one or the other.
 */
export async function claimAccount(email: string, password: string): Promise<boolean> {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data.session !== null;
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

export async function checkIsAdmin(): Promise<boolean> {
  const { data, error } = await supabase.rpc("is_admin");
  if (error) return false;
  return data === true;
}

/**
 * Sends a password-reset email (via Supabase Auth, routed through
 * whatever SMTP provider is configured in the dashboard). Doesn't throw
 * on an unknown email — Supabase itself avoids revealing whether an
 * address has an account, so the UI should show the same "check your
 * inbox" message regardless of the outcome.
 */
export async function requestPasswordReset(email: string): Promise<void> {
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
}

/** Sets a new password for whichever session is currently active — used
 * both by the password-recovery link flow and as a general "change my
 * password while signed in" path. */
export async function updatePassword(password: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}
