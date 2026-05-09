import bcrypt from "bcryptjs";
import { generateRecoveryCode, normalizeRecoveryCode } from "@/lib/recovery";

const BCRYPT_COST = 10;

export const DUMMY_PASSWORD_HASH =
  "$2b$10$SJHQwrdDNhXuMbGsTQ.RNOqleuTox9V/OvJ4p32nr/.Zjuyo/sWWW";

export const DUMMY_RECOVERY_HASH =
  "$2b$10$UKC7djKyGa6FP4QN1dt5.OtytV3zWNm3tLEfQ6e4yyoMByO3JrOMK";

export function hashPassword(password: string) {
  return bcrypt.hash(password, BCRYPT_COST);
}

export function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export { generateRecoveryCode };

export function hashRecoveryCode(code: string) {
  return bcrypt.hash(normalizeRecoveryCode(code), BCRYPT_COST);
}

export function verifyRecoveryCode(code: string, hash: string) {
  return bcrypt.compare(normalizeRecoveryCode(code), hash);
}
