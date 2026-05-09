import { cpSync, existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const copies = [
  [".next/static", ".next/standalone/.next/static"],
  ["public", ".next/standalone/public"],
];

for (const [source, target] of copies) {
  if (!existsSync(source)) {
    continue;
  }

  mkdirSync(dirname(target), { recursive: true });
  cpSync(source, target, { recursive: true });
}
