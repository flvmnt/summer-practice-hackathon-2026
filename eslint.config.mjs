import js from "@eslint/js";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      ".next/**",
      "coverage/**",
      "node_modules/**",
      "playwright-report/**",
      "test-results/**",
    ],
  },
  js.configs.recommended,
  ...nextVitals,
  ...nextTs,
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { "prefer": "type-imports" }
      ],
    },
  },
);
