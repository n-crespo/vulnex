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

  // User journey: User uploads file, scans it, and dismisses a vulnerability
  test("should complete full analysis workflow: upload -> scan -> dismiss", async ({
    page,
  }) => {
    // mock the bulk scan endpoint to ensure consistent results
    await page.route("**/api/cves/bulk-scan", async (route) => {
      const json = [
        {
          package: "react",
          version: "16.8.0",
          cves: [{ cveId: "CVE-2020-0000", severityLevel: "HIGH" }],
        },
      ];
      await route.fulfill({ json });
    });

    // navigate to analyze tab
    await page.getByRole("button", { name: /Analyze/i }).click();

    // create a dummy package.json buffer
    const buffer = Buffer.from(
      JSON.stringify({
        name: "TEST",
        private: true,
        version: "0.0.0",
        type: "module",
        dependencies: { react: "16.8.0" },
      }),
    );

    // upload file
    // note: input is hidden, so we target it by attribute
    await page.setInputFiles('input[type="file"]', {
      name: "package.json",
      mimeType: "application/json",
      buffer,
    });

    // verify upload success state
    await expect(page.getByText("dependencies detected")).toBeVisible();

    // click scan
    await page.getByRole("button", { name: /Scan Dependencies/i }).click();

    // verify results appeared
    await expect(page.getByText("Found issues in 1 packages")).toBeVisible();
    await expect(page.getByText("CVE-2020-0000")).toBeVisible();

    // dismiss the cve
    // we need to hover the card first to make the button visible (opacity-0 -> 100)
    const card = page.locator(".relative.group").first();
    await card.hover();
    await page.click("button.absolute.bottom-4.right-4");

    // verify cve is gone
    await expect(page.getByText("CVE-2020-0000")).not.toBeVisible();
    await expect(page.getByText("0 CVEs Found")).toBeVisible();
  });

  // pagination (user pages through multiple pages of data)
  // test("should handle pagination flow: next -> prev", async ({ page }) => {
  //   // mock api to return enough items to trigger pagination (limit is 25)
  //   await page.route("**/api/cves?*", async (route) => {
  //     const url = new URL(route.request().url());
  //     const skip = url.searchParams.get("skip") || "0";
  //
  //     // generate 30 fake items total
  //     // if skip is 0, return items 0-25. if skip is 25, return items 25-30
  //     const totalItems = 30;
  //     const mockData = Array.from({ length: totalItems }).map((_, i) => ({
  //       cveId: `CVE-PAGE-${i}`,
  //       severityLevel: "LOW",
  //       description: `Description ${i}`,
  //       productName: "test",
  //       productVersions: [],
  //       published: new Date().toISOString(),
  //     }));
  //
  //     const skipInt = parseInt(skip);
  //     const sliced = mockData.slice(skipInt, skipInt + 25);
  //
  //     await route.fulfill({
  //       json: sliced,
  //       headers: { "X-Total-Count": totalItems.toString() },
  //     });
  //   });
  //
  //   await page.goto("/");
  //
  //   // verify initial state (showing 1-25)
  //   await expect(page.getByText(/Showing 1-25 of 30/i)).toBeVisible();
  //
  //   // click next page
  //   await page.getByRole("button", { name: /Next/i }).last().click();
  //
  //   // verify second page state (showing 26-30)
  //   await expect(page.getByText(/Showing 26-30 of 30/i)).toBeVisible();
  //   await expect(page.getByText("CVE-PAGE-29")).toBeVisible();
  //
  //   // ensure first page items are gone
  //   await expect(page.getByText("CVE-PAGE-0")).not.toBeVisible();
  //
  //   // click prev page
  //   await page.getByRole("button", { name: /Prev/i }).last().click();
  //
  //   // verify back to start
  //   await expect(page.getByText(/Showing 1-25 of 30/i)).toBeVisible();
  // });
});
