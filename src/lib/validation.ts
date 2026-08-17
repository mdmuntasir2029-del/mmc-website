export const STUDENT_CODE_MAX_YEAR = 2026;

/**
 * Student code format: 9 digits total — first 4 are a year (up to
 * STUDENT_CODE_MAX_YEAR), followed by a 5-digit sequence, e.g. "202600123".
 */
export function validateStudentCode(code: string): string | null {
  const trimmed = code.trim();
  if (!/^\d{9}$/.test(trimmed)) {
    return "Student code must be exactly 9 digits.";
  }
  const year = parseInt(trimmed.slice(0, 4), 10);
  if (year > STUDENT_CODE_MAX_YEAR) {
    return `The first 4 digits must be a year no later than ${STUDENT_CODE_MAX_YEAR}.`;
  }
  return null;
}

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
