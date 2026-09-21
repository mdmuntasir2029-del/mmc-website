export function validatePhone(phone: string): string | null {
  const trimmed = phone.trim();
  if (!trimmed) return "Phone number is required.";
  if (!/^[0-9+\-\s]{7,15}$/.test(trimmed)) {
    return "Enter a valid phone number.";
  }
  return null;
}

export function validateEmail(email: string): string | null {
  const trimmed = email.trim();
  if (!trimmed) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return "Enter a valid email address.";
  }
  return null;
}
