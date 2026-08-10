import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers";

// These tests spread logins across different seeded users (rather than
// reusing one) to stay well under the login rate limit (5 per 15 min per
// email) shared with the rest of the suite.

test("avatar link goes straight to the signed-in user's own profile", async ({ page }) => {
  await loginAs(page, "kit@example.com");
  await page.getByRole("link", { name: "Your profile" }).click();
  await expect(page).toHaveURL(/\/profile\/kit$/);
});

test("account chevron opens the menu without crashing", async ({ page }) => {
  await loginAs(page, "kit@example.com");
  await page.getByRole("button", { name: "Open account menu" }).click();
  await expect(page.getByRole("menuitem", { name: "Settings" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
  await expect(page.getByText("Something went wrong")).toHaveCount(0);
});

test.describe("mobile viewport", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("account chevron is hidden, avatar and hamburger remain", async ({ page }) => {
    await loginAs(page, "jules@example.com");
    await expect(page.getByRole("link", { name: "Your profile" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Open menu" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Open account menu" })).toBeHidden();
  });

  test("hamburger sheet has no duplicate profile link", async ({ page }) => {
    await loginAs(page, "jules@example.com");
    await page.getByRole("button", { name: "Open menu" }).click();
    const dialog = page.getByRole("dialog", { name: "Dragon's Den" });
    await expect(dialog.getByRole("link", { name: "Settings" })).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Sign out" })).toBeVisible();
    await expect(dialog.getByRole("link", { name: "Your profile" })).toHaveCount(0);
    await expect(dialog.getByRole("link", { name: "Jules Bergström" })).toHaveCount(0);
  });
});
