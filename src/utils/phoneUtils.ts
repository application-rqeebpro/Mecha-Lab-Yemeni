/**
 * Yemeni Phone & Identity Normalization Utility
 * Ensures seamless phone matching across international (+967), local (07...),
 * Arabic numerals (٠-٩), and raw formats.
 */

export function normalizePhone(raw: string): string {
  if (!raw) return '';
  
  // 1. Convert Arabic-Indic numerals (٠-٩) and Persian numerals (۰-۹)
  const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  const persianNumerals = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  
  let cleaned = String(raw).trim();
  for (let i = 0; i < 10; i++) {
    cleaned = cleaned.replaceAll(arabicNumerals[i], String(i));
    cleaned = cleaned.replaceAll(persianNumerals[i], String(i));
  }

  // 2. If it's an email address, lowercase and return
  if (cleaned.includes('@')) {
    return cleaned.toLowerCase().trim();
  }

  // 3. Remove all non-digits (spaces, dashes, parentheses, plus sign)
  cleaned = cleaned.replace(/\D/g, '');

  // 4. Strip Yemeni country codes
  if (cleaned.startsWith('00967')) {
    cleaned = cleaned.substring(5);
  } else if (cleaned.startsWith('967')) {
    cleaned = cleaned.substring(3);
  }

  // 5. Strip leading local zero if phone length > 8 (e.g. 0771234567 -> 771234567)
  if (cleaned.startsWith('0') && cleaned.length >= 9) {
    cleaned = cleaned.substring(1);
  }

  return cleaned;
}

/**
 * Format phone for display with proper spacing
 */
export function formatPhoneDisplay(raw: string): string {
  const norm = normalizePhone(raw);
  if (norm.length === 9) {
    // 771 234 567
    return `${norm.substring(0, 3)} ${norm.substring(3, 6)} ${norm.substring(6)}`;
  }
  return norm;
}
