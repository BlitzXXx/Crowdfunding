import { expect, test } from "@playwright/test";

test.describe("app smoke", () => {
  test("renders header and hero", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: /crowdchain/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /connect wallet/i })).toBeVisible();
  });

  test("navigates to create page", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Create" }).click();
    await expect(page).toHaveURL(/\/create/);
  });

  test("navigates to dashboard", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Dashboard" }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
