import type { Page } from "@playwright/test";

export const DEMO_PASSWORD = "password123";

export async function loginAs(page: Page, email: string, password = DEMO_PASSWORD) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("main").getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/feed");
}
