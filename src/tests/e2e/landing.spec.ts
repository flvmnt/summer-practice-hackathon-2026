import { expect, test } from "@playwright/test";

test("landing page renders in the default e2e suite", async ({ page }) => {
  await page.goto("/en");

  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("link", { name: /start playing/i })).toBeVisible();
});
