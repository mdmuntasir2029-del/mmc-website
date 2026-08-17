/**
 * Admin auth for the static prototype. There is exactly one privileged
 * account, gated by email, with a password the admin sets on first sign-in
 * (hashed with SHA-256 before it ever touches storage). This whole file is
 * a placeholder for real auth (Brevo/Supabase) — everything else in the
 * app only calls the functions below, never localStorage directly, so the
 * migration later is contained to this file.
 */
import { readValue, writeValue, removeValue } from "./storage";

export const ADMIN_EMAIL = "mdmuntasir.2029@gmail.com";

const CREDENTIAL_KEY = "admin_credential";
const SESSION_KEY = "session";

interface StoredCredential {
  hash: string;
}

interface Session {
  email: string;
  signedInAt: string;
}

async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function isAdminEmail(email: string): boolean {
  return email.trim().toLowerCase() === ADMIN_EMAIL;
}

export function hasAdminPassword(): boolean {
  return readValue<StoredCredential>(CREDENTIAL_KEY) !== null;
}

export async function setAdminPassword(password: string): Promise<void> {
  const hash = await sha256Hex(password);
  writeValue<StoredCredential>(CREDENTIAL_KEY, { hash });
}

export async function verifyAdminPassword(password: string): Promise<boolean> {
  const stored = readValue<StoredCredential>(CREDENTIAL_KEY);
  if (!stored) return false;
  const hash = await sha256Hex(password);
  return hash === stored.hash;
}

export function getSession(): Session | null {
  return readValue<Session>(SESSION_KEY);
}

export function startSession(email: string): void {
  writeValue<Session>(SESSION_KEY, {
    email,
    signedInAt: new Date().toISOString(),
  });
}

export function endSession(): void {
  removeValue(SESSION_KEY);
}
