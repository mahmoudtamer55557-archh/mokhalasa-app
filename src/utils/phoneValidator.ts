/**
 * =====================================================================
 * MOKHALASA — EGYPTIAN PHONE VALIDATOR & NORMALIZATION MODULE
 * =====================================================================
 * Validates and normalizes Egyptian mobile phone numbers according to
 * the National Telecommunications Regulatory Authority (NTRA) standards:
 * - Networks: Vodafone (010), Etisalat (011), Orange (012), WE (015)
 * - Local format: 11 digits (e.g., 01012345678)
 * - International format: +201012345678, 00201012345678, or 201012345678
 * 
 * Separates "phone entered" state from "phone verified" state.
 */

/**
 * Strips all spaces, dashes, brackets, and non-digit characters except leading '+'
 */
export function sanitizePhoneInput(input: string): string {
  if (!input) return '';
  // Keep leading + if present, strip all other non-digits
  const trimmed = input.trim();
  const hasPlus = trimmed.startsWith('+');
  const digitsOnly = trimmed.replace(/\D/g, '');
  return hasPlus ? `+${digitsOnly}` : digitsOnly;
}

/**
 * Normalizes any valid Egyptian mobile number into canonical 11-digit local format:
 * e.g. "+201012345678" -> "01012345678"
 * e.g. "00201012345678" -> "01012345678"
 * e.g. "201012345678" -> "01012345678"
 * e.g. "01012345678" -> "01012345678"
 */
export function normalizeEgyptianPhone(input: string): string {
  const sanitized = sanitizePhoneInput(input);
  if (!sanitized) return '';

  let digits = sanitized.replace(/\D/g, '');

  // Handle leading 0020 or 20 country code
  if (digits.startsWith('0020')) {
    digits = digits.slice(4);
  } else if (digits.startsWith('20') && digits.length === 12) {
    digits = digits.slice(2);
  }

  // Ensure leading zero
  if (!digits.startsWith('0') && digits.length === 10) {
    digits = `0${digits}`;
  }

  return digits;
}

/**
 * Checks whether an input string is a valid Egyptian mobile phone number
 */
export function isValidEgyptianPhone(input: string): boolean {
  if (!input) return false;
  const normalized = normalizeEgyptianPhone(input);
  // Must be exactly 11 digits, starting with 010, 011, 012, or 015
  return /^01[0125]\d{8}$/.test(normalized);
}

/**
 * Returns an actionable Arabic validation error message if invalid, or null if valid
 */
export function getPhoneValidationError(input: string): string | null {
  if (!input || !input.trim()) {
    return 'رقم الهاتف مطلوب لتسجيل الحساب ومتابعة المعاملة.';
  }

  const normalized = normalizeEgyptianPhone(input);
  
  if (normalized.length !== 11) {
    return 'رقم الهاتف المصري يجب أن يتكون من 11 رقماً (مثال: 01012345678).';
  }

  if (!/^01[0125]/.test(normalized)) {
    return 'رقم الهاتف يجب أن يبدأ بكود شبكة مصري معتمد (010، 011، 012، أو 015).';
  }

  if (!isValidEgyptianPhone(normalized)) {
    return 'صيغة رقم الهاتف غير صحيحة. يرجى كتابة رقم هاتف مصري مكوّن من 11 رقماً.';
  }

  return null;
}

/**
 * Formats a valid 11-digit phone number for user-friendly display: e.g. "010 1234 5678"
 */
export function formatPhoneDisplay(input: string): string {
  const normalized = normalizeEgyptianPhone(input);
  if (normalized.length === 11) {
    return `${normalized.slice(0, 3)} ${normalized.slice(3, 7)} ${normalized.slice(7)}`;
  }
  return input;
}
