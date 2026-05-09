import bcrypt from "bcryptjs";
import { generateRecoveryCode, normalizeRecoveryCode } from "@/lib/recovery";

const BCRYPT_COST = 12;

export const DUMMY_PASSWORD_HASH =
  "$2b$12$A.427bJiyPIQfn/Xnu0/ouf/mDDXunuQbhlv9HrA0g0iQz5TjOkUe";

export const DUMMY_RECOVERY_HASH =
  "$2b$12$M5CWKa.eQubwznTufoPXV.G4mEUdc2wmgIn7SP3F0DWdUj0QrMyk2";

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
