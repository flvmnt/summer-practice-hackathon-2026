#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const messagesDir = path.join(root, "messages");
const routingFile = fs.readFileSync(path.join(root, "src/i18n/routing.ts"), "utf8");
const localesMatch = routingFile.match(/locales:\s*\[([^\]]+)\]/m);
const locales = localesMatch
  ? [...localesMatch[1].matchAll(/"([^"]+)"/g)].map((match) => match[1])
  : ["ro", "en"];

function extractArguments(message) {
  const args = new Set();
  const matches = message.matchAll(/\{\s*([a-zA-Z][\w]*)\b[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g);
  for (const match of matches) {
    args.add(match[1]);
  }
  return [...args].sort();
}

function validateMessageSyntax(message, label) {
  let depth = 0;
  for (const char of message) {
    if (char === "{") depth += 1;
    if (char === "}") depth -= 1;
    if (depth < 0) {
      failures.push(`${label}: unmatched closing brace`);
      return;
    }
  }

  if (depth !== 0) {
    failures.push(`${label}: unmatched opening brace`);
  }
}

function flatten(value, prefix = "") {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => flatten(item, `${prefix}[${index}]`));
  }

  if (value !== null && typeof value === "object") {
    return Object.entries(value).flatMap(([key, child]) =>
      flatten(child, prefix ? `${prefix}.${key}` : key),
    );
  }

  return [[prefix, typeof value, value]];
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

const failures = [];
const namespaceSet = new Set();

for (const locale of locales) {
  const localeDir = path.join(messagesDir, locale);
  if (!fs.existsSync(localeDir)) {
    failures.push(`Missing locale directory: messages/${locale}`);
    continue;
  }

  for (const file of fs.readdirSync(localeDir)) {
    if (file.endsWith(".json")) {
      namespaceSet.add(file);
    }
  }
}

for (const namespace of namespaceSet) {
  const flattenedByLocale = new Map();

  for (const locale of locales) {
    const filePath = path.join(messagesDir, locale, namespace);
    if (!fs.existsSync(filePath)) {
      failures.push(`Missing ${locale}/${namespace}`);
      continue;
    }

    const flattened = flatten(readJson(filePath));
    for (const [key, type, value] of flattened) {
      if (type === "string") {
        validateMessageSyntax(value, `${locale}/${namespace}:${key}`);
      }
    }
    flattenedByLocale.set(locale, new Map(flattened.map(([key, type, value]) => [key, { type, value }])));
  }

  const baseline = flattenedByLocale.get(locales[0]);
  if (!baseline) continue;

  for (const locale of locales.slice(1)) {
    const current = flattenedByLocale.get(locale);
    if (!current) continue;

    for (const [key, baseEntry] of baseline) {
      if (!current.has(key)) {
        failures.push(`${namespace}: ${key} missing in ${locale}`);
      } else if (current.get(key).type !== baseEntry.type) {
        failures.push(`${namespace}: ${key} type mismatch in ${locale}`);
      } else if (baseEntry.type === "string") {
        const baseArgs = extractArguments(baseEntry.value);
        const currentArgs = extractArguments(current.get(key).value);
        if (baseArgs.join(",") !== currentArgs.join(",")) {
          failures.push(
            `${namespace}: ${key} ICU argument mismatch in ${locale} (${locales[0]}: ${baseArgs.join(",") || "none"}; ${locale}: ${currentArgs.join(",") || "none"})`,
          );
        }
      }
    }

    for (const key of current.keys()) {
      if (!baseline.has(key)) {
        failures.push(`${namespace}: ${key} missing in ${locales[0]}`);
      }
    }
  }
}

if (failures.length > 0) {
  console.error("i18n check failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("i18n check passed.");
