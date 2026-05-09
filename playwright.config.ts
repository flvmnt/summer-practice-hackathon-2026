import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./src/tests/e2e",
  fullyParallel: true,
  reporter: [["html", { open: "never" }], ["list"]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 5"] },
    },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: "pnpm dev",
        url: "http://127.0.0.1:3000",
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
