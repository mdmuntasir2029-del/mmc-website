/**
 * Thin localStorage wrapper. This is the ONLY file in the data layer that
 * knows about localStorage — db.ts and auth.ts call through here, so
 * swapping in Supabase later means rewriting db.ts/auth.ts internals
 * without touching every call site in the app.
 */

const NAMESPACE = "mmc";

function fullKey(key: string): string {
  return `${NAMESPACE}:${key}`;
}

export function readList<T>(key: string): T[] {
  const raw = localStorage.getItem(fullKey(key));
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeList<T>(key: string, value: T[]): void {
  localStorage.setItem(fullKey(key), JSON.stringify(value));
}

export function readValue<T>(key: string): T | null {
  const raw = localStorage.getItem(fullKey(key));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function writeValue<T>(key: string, value: T): void {
  localStorage.setItem(fullKey(key), JSON.stringify(value));
}

export function removeValue(key: string): void {
  localStorage.removeItem(fullKey(key));
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function newId(): string {
  return crypto.randomUUID();
}
