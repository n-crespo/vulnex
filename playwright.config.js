// @ts-check
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e/",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: [
    {
      // Start the API backend
      command: "npm run start:api",
      url: "http://localhost:3000",
      timeout: 120 * 1000,
      reuseExistingServer: !process.env.CI,
    },
    {
      // Start the Frontend
      command: "npm run dev -- --host",
      url: "http://localhost:5173",
      timeout: 120 * 1000,
      reuseExistingServer: !process.env.CI,
    },
  ],

  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
  },
});
