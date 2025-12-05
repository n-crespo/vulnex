import { test, expect } from "@playwright/test";

test.describe("Vulnex UI E2E", () => {
  test.beforeEach(async ({ page }) => {
    // go to the home page before each test
    await page.goto("/");
  });

  test("should display mock data", async ({ page }) => {
    // intercept API call
    await page.route("*/**/api/cves*", async (route) => {
      const json = [
        {
          cveId: "CVE-MOCK-1",
          published: "2025-06-17T14:15:33.170",
          description: "Fake bug",
          severityLevel: "HIGH",
          productName: "fake:product",
          productVersions: [
            {
              start: "0",
              s_type: "i",
              end: "999",
              e_type: "e",
            },
          ],
        },
      ];
      await route.fulfill({ json });
    });

    await page.goto("/");
    await expect(page.getByText("CVE-MOCK-1")).toBeVisible();
  });

  test("should load the home page and display CVEs", async ({ page }) => {
    // check for the main title
    await expect(
      page.getByRole("heading", { name: /Vulnerabilities/i }),
    ).toBeVisible();

    // check at least one CVE card is rendered
    const cveCards = page.locator(".border.rounded-lg");
    await expect(cveCards.first()).toBeVisible({ timeout: 10000 });
  });

  test("should open and close the Login modal", async ({ page }) => {
    // click the Login button in Header
    await page.getByRole("button", { name: /Login/i }).click();

    // check Modal is visible
    const modal = page.getByRole("heading", { name: /Welcome Back/i });
    await expect(modal).toBeVisible();

    // close the modal using the X button
    await page.locator(".z-50 button > .lucide-x").click();
    await expect(modal).not.toBeVisible();
  });

  test("should filter CVEs when search terms are applied", async ({ page }) => {
    // type "Chrome" into the Product Name input
    await page.getByPlaceholder("e.g. Chrome, Windows").fill("Chrome");
    await page.getByRole("button", { name: /Apply Filters/i }).click();

    await expect(page.getByText(/Updating results.../i)).toBeVisible();

    // ensure the app didn't crash and cards are still visible
    await expect(page.locator(".border.rounded-lg").first()).toBeVisible();
  });

  test("should switch to Analyze tab", async ({ page }) => {
    // click "Analyze" in the header
    await page.getByRole("button", { name: /Analyze/i }).click();

    // verify the Analyze view loaded
    await expect(page.getByText(/Upload package.json/i)).toBeVisible();
  });
});
