export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_REGEX = /^[6-9]\d{9}$/; // Indian mobile
export const PINCODE_REGEX = /^\d{6}$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

export function isValidPhone(phone: string): boolean {
  return PHONE_REGEX.test(phone);
}

export function isValidPincode(pincode: string): boolean {
  return PINCODE_REGEX.test(pincode);
}
