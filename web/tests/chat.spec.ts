import { test, expect } from "@playwright/test";

test.describe("Delta chat", () => {
  test("loads home page", async ({ page }) => {
    await page.goto("/chat/new");
    await page.waitForURL(/\/chat\//);
    await expect(page.getByText("Delta provides informational sports intelligence"))
      .toBeVisible();
  });
});
