process.loadEnvFile?.(".env");

import { defineConfig, devices } from "@playwright/test";

const PORT = 3101;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  globalSetup: "./e2e/global-setup.ts",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  webServer: {
    command: `pnpm exec next dev -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 60_000,
    // Spread process.env explicitly -- Playwright's webServer.env replaces
    // rather than merges with the inherited environment. NEXT_PUBLIC_APP_URL
    // is overridden to match PORT so generated links (e.g. password reset)
    // point back at this same test server. RESEND_API_KEY is deliberately
    // left unset so requestPasswordResetAction falls back to returning the
    // reset link directly instead of emailing it.
    env: { ...(process.env as Record<string, string>), NEXT_PUBLIC_APP_URL: `http://localhost:${PORT}` },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
