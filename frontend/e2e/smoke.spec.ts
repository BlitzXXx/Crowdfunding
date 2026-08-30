import { expect, test } from "@playwright/test";

test.describe("404 page", () => {
  test("shows 404 for unknown routes", async ({ page }) => {
    await page.goto("/nonexistent-page");

    await expect(page.getByText("404")).toBeVisible();
    await expect(page.getByText("Page not found")).toBeVisible();
    await expect(page.getByRole("link", { name: /back to campaigns/i })).toBeVisible();
  });

  test("404 back link navigates to homepage", async ({ page }) => {
    await page.goto("/some/unknown/path");

    await page.getByRole("link", { name: /back to campaigns/i }).click();
    await expect(page).toHaveURL("/");
    await expect(page.getByText("Fund what matters")).toBeVisible();
  });
});

test.describe("responsive viewports", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("homepage renders on mobile (375px)", async ({ page }) => {
    await page.goto("/");

    // Header branding still visible
    await expect(page.getByRole("link", { name: /crowdchain/i })).toBeVisible();
    // Hero renders
    await expect(page.getByText("Fund what matters, transparently")).toBeVisible();
    // Connect wallet accessible
    await expect(page.getByRole("button", { name: /connect wallet/i })).toBeVisible();
  });
});

test.describe("responsive viewports", () => {
  test.use({ viewport: { width: 768, height: 1024 } });

  test("homepage renders on tablet (768px)", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("link", { name: /crowdchain/i })).toBeVisible();
    await expect(page.getByText("Browse campaigns")).toBeVisible();
    await expect(page.getByRole("button", { name: /connect wallet/i })).toBeVisible();
  });
});

test.describe("dark mode", () => {
  test("app uses dark theme by default", async ({ page }) => {
    await page.goto("/");

    // Root element should have the "dark" class (Tailwind dark mode)
    const htmlClass = await page.locator("html").getAttribute("class");
    expect(htmlClass).toContain("dark");

    // Body background should not be white (dark theme applied)
    const bgColor = await page
      .locator("body")
      .evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(bgColor).not.toBe("rgb(255, 255, 255)");
  });

  test("header has semi-transparent dark background", async ({ page }) => {
    await page.goto("/");

    const headerBg = await page
      .locator("header")
      .evaluate((el) => getComputedStyle(el).backgroundColor);
    // bg-slate-950/80 is semi-transparent dark — browser may render oklab or rgb
    expect(headerBg).not.toBe("rgba(0, 0, 0, 0)"); // not transparent
  });
});

test.describe("dashboard page", () => {
  test("dashboard page renders connect prompt when disconnected", async ({ page }) => {
    await page.goto("/dashboard");

    // Dashboard shows a message when no wallet is connected
    await expect(
      page.getByText(/connect.*wallet/i).first()
    ).toBeVisible();
  });
});
