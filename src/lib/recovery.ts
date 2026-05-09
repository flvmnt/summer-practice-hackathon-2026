import { randomInt } from "node:crypto";
import { recoveryCodeSchema } from "@/lib/contracts/auth";

const RECOVERY_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomRecoverySegment() {
  let segment = "";

  for (let index = 0; index < 4; index += 1) {
    segment += RECOVERY_ALPHABET[randomInt(RECOVERY_ALPHABET.length)];
  }

  return segment;
}

export function generateRecoveryCode() {
  return `SM2M-${randomRecoverySegment()}-${randomRecoverySegment()}`;
}

export function normalizeRecoveryCode(input: string) {
  return recoveryCodeSchema.parse(input);
}
