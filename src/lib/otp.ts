import * as argon2 from "argon2";

export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function hashOtp(otp: string): Promise<string> {
  return await argon2.hash(otp);
}

export async function verifyOtp(
  hashedOtp: string,
  otp: string
): Promise<boolean> {
  return await argon2.verify(hashedOtp, otp);
}
