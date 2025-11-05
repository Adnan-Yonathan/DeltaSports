import { test } from "@playwright/test";

test.describe("Delta chat", () => {
  test("placeholder - streaming experience", async ({ page }) => {
    test.skip(true, "E2E implementation pending real backend");
    await page.goto("/chat/new");
  });
});
