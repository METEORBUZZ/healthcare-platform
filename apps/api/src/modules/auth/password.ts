import crypto from 'node:crypto';

const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const LOWER = 'abcdefghjkmnpqrstuvwxyz';
const DIGITS = '23456789';
const SYMBOLS = '!@#$%^&*';
const ALL = UPPER + LOWER + DIGITS + SYMBOLS;

/**
 * Generates a cryptographically secure temporary password meeting the application password policy.
 * Uses Node crypto.randomInt (no Math.random, no timestamps, no user info).
 */
export function generateTemporaryPassword(length = 14): string {
  const chars: string[] = [
    UPPER[crypto.randomInt(0, UPPER.length)]!,
    UPPER[crypto.randomInt(0, UPPER.length)]!,
    LOWER[crypto.randomInt(0, LOWER.length)]!,
    LOWER[crypto.randomInt(0, LOWER.length)]!,
    DIGITS[crypto.randomInt(0, DIGITS.length)]!,
    DIGITS[crypto.randomInt(0, DIGITS.length)]!,
    SYMBOLS[crypto.randomInt(0, SYMBOLS.length)]!,
    SYMBOLS[crypto.randomInt(0, SYMBOLS.length)]!,
  ];

  while (chars.length < length) {
    chars.push(ALL[crypto.randomInt(0, ALL.length)]!);
  }

  // Fisher-Yates shuffle using crypto.randomInt
  for (let i = chars.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    const temp = chars[i]!;
    chars[i] = chars[j]!;
    chars[j] = temp;
  }

  return chars.join('');
}

/**
 * Enforces the application password policy:
 * - Length: 8 - 72 characters
 * - Requires at least one letter and at least one digit
 * - Cannot equal email or email local-part
 * - Cannot equal username or name
 * - Must differ from current password
 * - Rejects trivial weak passwords
 */
export function validatePasswordPolicy(
  password: string,
  user?: { email?: string; name?: string },
  currentPassword?: string,
): { valid: boolean; message?: string } {
  if (!password || password.trim() === '') {
    return { valid: false, message: 'Password is required and cannot be empty.' };
  }
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long.' };
  }
  if (password.length > 72) {
    return { valid: false, message: 'Password must be at most 72 characters long.' };
  }
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return { valid: false, message: 'Password must include at least one letter and one number.' };
  }
  if (currentPassword && password === currentPassword) {
    return { valid: false, message: 'New password must be different from current password.' };
  }
  if (user?.email) {
    const emailLower = user.email.toLowerCase().trim();
    if (password.toLowerCase() === emailLower) {
      return { valid: false, message: 'Password cannot be the same as your email address.' };
    }
    const localPart = emailLower.split('@')[0];
    if (localPart && localPart.length >= 3 && password.toLowerCase() === localPart) {
      return { valid: false, message: 'Password cannot be the same as your email username.' };
    }
  }
  if (user?.name) {
    const nameLower = user.name.toLowerCase().trim();
    if (nameLower.length >= 3 && password.toLowerCase() === nameLower) {
      return { valid: false, message: 'Password cannot be the same as your name.' };
    }
  }
  const commonWeak = ['password', 'password1', '12345678', 'admin123', 'admin12345', 'qwerty123', 'welcome1'];
  if (commonWeak.includes(password.toLowerCase())) {
    return { valid: false, message: 'Password is too common and weak. Please choose a stronger password.' };
  }
  return { valid: true };
}
