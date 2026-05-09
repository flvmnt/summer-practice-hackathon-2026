#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const messagesDir = path.join(root, "messages");
const locales = ["ro", "en"];

function flatten(value, prefix = "") {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => flatten(item, `${prefix}[${index}]`));
  }

  if (value !== null && typeof value === "object") {
    return Object.entries(value).flatMap(([key, child]) =>
      flatten(child, prefix ? `${prefix}.${key}` : key),
    );
  }

  return [[prefix, typeof value]];
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

    flattenedByLocale.set(locale, new Map(flatten(readJson(filePath))));
  }

  const baseline = flattenedByLocale.get(locales[0]);
  if (!baseline) continue;

  for (const locale of locales.slice(1)) {
    const current = flattenedByLocale.get(locale);
    if (!current) continue;

    for (const [key, type] of baseline) {
      if (!current.has(key)) {
        failures.push(`${namespace}: ${key} missing in ${locale}`);
      } else if (current.get(key) !== type) {
        failures.push(`${namespace}: ${key} type mismatch in ${locale}`);
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
