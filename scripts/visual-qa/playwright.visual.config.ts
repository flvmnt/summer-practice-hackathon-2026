import { defineConfig, devices } from "@playwright/test";
import path from "node:path";

const baseURL =
  process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3100";

export default defineConfig({
  testDir: path.resolve(__dirname, "..", "..", "e2e"),
  fullyParallel: false,
  reporter: [["list"]],
  use: {
    baseURL,
    trace: "off",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
