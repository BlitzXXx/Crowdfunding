import { expect, test } from "@playwright/test";

test.describe("UI smoke tests", () => {
  test("homepage loads with branding and hero section", async ({ page }) => {
    await page.goto("/");

    // Header branding
    await expect(page.getByRole("link", { name: /crowdchain/i })).toBeVisible();

    // Hero section renders
    await expect(page.getByText("Fund what matters, transparently")).toBeVisible();
    await expect(
      page.getByText("Every campaign lives as its own smart contract")
    ).toBeVisible();

    // Footer renders
    await expect(page.getByText("Contracts are law")).toBeVisible();
  });

  test("campaign browse section renders with filters and search", async ({ page }) => {
    await page.goto("/");

    // Browse section heading
    await expect(page.getByText("Browse campaigns")).toBeVisible();

    // Search input present
    await expect(page.getByPlaceholder("Search address or creator…")).toBeVisible();

    // State filter tabs present
    const filterTabs = page.getByRole("tablist", { name: /filter by state/i });
    await expect(filterTabs).toBeVisible();
    await expect(filterTabs.getByRole("tab", { name: "All" })).toBeVisible();
    await expect(filterTabs.getByRole("tab", { name: "Active" })).toBeVisible();
    await expect(filterTabs.getByRole("tab", { name: "Funded" })).toBeVisible();

    // Sort dropdown present
    await expect(page.getByLabel("Sort campaigns")).toBeVisible();
  });

  test("navigation between pages works", async ({ page }) => {
    await page.goto("/");

    // Navigate to Create page (use exact match to disambiguate from "Create campaign" button)
    await page.getByRole("link", { name: "Create", exact: true }).click();
    await expect(page).toHaveURL(/\/create/);

    // Navigate to Dashboard
    await page.getByRole("link", { name: "Dashboard" }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    // Navigate back to home via logo
    await page.getByRole("link", { name: /crowdchain/i }).click();
    await expect(page).toHaveURL("/");
  });

  test("connect wallet button is present in header", async ({ page }) => {
    await page.goto("/");

    const connectBtn = page.getByRole("button", { name: /connect wallet/i });
    await expect(connectBtn).toBeVisible();
  });

  test("create page shows connect prompt when wallet is disconnected", async ({ page }) => {
    await page.goto("/create");

    // Without a wallet, should show "Connect your wallet to create a campaign"
    await expect(
      page.getByText("Connect your wallet to create a campaign")
    ).toBeVisible();
  });
});
