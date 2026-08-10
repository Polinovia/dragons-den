import { test, expect } from "@playwright/test";
import { loginAs, DEMO_PASSWORD } from "./helpers";

test.describe("registration", () => {
  test("register creates an account and auto-signs in", async ({ page }) => {
    const suffix = Date.now();
    await page.goto("/register");
    await page.getByLabel("Display name").fill("Test User");
    await page.getByLabel("Username").fill(`testuser${suffix}`);
    await page.getByLabel("Email").fill(`testuser${suffix}@example.com`);
    await page.getByLabel("Password").fill("a-strong-password");
    await page.getByRole("button", { name: "Create account" }).click();
    await page.waitForURL("**/feed");
    await expect(page.getByRole("link", { name: "Your profile" })).toBeVisible();
  });
});

test.describe("login / logout", () => {
  test("login with valid credentials reaches the feed", async ({ page }) => {
    await loginAs(page, "mira@example.com");
    await expect(page).toHaveURL(/\/feed$/);
  });

  test("invalid credentials show an error", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("mira@example.com");
    await page.getByLabel("Password").fill("wrong-password");
    await page.getByRole("main").getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "Invalid email or password." })).toBeVisible();
  });

  test("sign out returns to the logged-out homepage", async ({ page }) => {
    await loginAs(page, "theo@example.com");
    await page.getByRole("button", { name: "Open account menu" }).click();
    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL("/");
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  });
});

test.describe("already-authenticated redirects", () => {
  test("visiting /login while signed in redirects to /feed", async ({ page }) => {
    await loginAs(page, "priya@example.com");
    await page.goto("/login");
    await expect(page).toHaveURL(/\/feed$/);
  });

  test("visiting /register while signed in redirects to /feed", async ({ page }) => {
    await loginAs(page, "priya@example.com");
    await page.goto("/register");
    await expect(page).toHaveURL(/\/feed$/);
  });
});

test.describe("forgot / reset password", () => {
  const email = "sam@example.com";
  const newPassword = "brand-new-password-1";

  test("unknown email shows not-found message", async ({ page }) => {
    await page.goto("/forgot-password");
    await page.getByLabel("Email").fill("nobody@example.com");
    await page.getByRole("button", { name: "Find account" }).click();
    await expect(page.getByText("No account with that email.")).toBeVisible();
  });

  test("known email allows setting a new password, then logging in with it", async ({ page }) => {
    await page.goto("/forgot-password");
    await page.getByLabel("Email").fill(email);
    await page.getByRole("button", { name: "Find account" }).click();

    await expect(page.getByText(email, { exact: false })).toBeVisible();
    await page.getByLabel("New password").fill(newPassword);
    await page.getByLabel("Confirm password").fill(newPassword);
    await page.getByRole("button", { name: "Set new password" }).click();

    await page.waitForURL("**/login");
    await loginAs(page, email, newPassword);
    await expect(page).toHaveURL(/\/feed$/);
  });

  test("mismatched passwords are rejected client-side", async ({ page }) => {
    await page.goto("/forgot-password");
    await page.getByLabel("Email").fill("jules@example.com");
    await page.getByRole("button", { name: "Find account" }).click();

    await page.getByLabel("New password").fill("password-one-1");
    await page.getByLabel("Confirm password").fill("password-two-2");
    await page.getByRole("button", { name: "Set new password" }).click();

    await expect(page.getByText("Passwords don't match.")).toBeVisible();
    await expect(page).toHaveURL(/\/forgot-password$/);
  });
});

test("original demo password still works for an untouched account", async ({ page }) => {
  await loginAs(page, "ana@example.com", DEMO_PASSWORD);
  await expect(page).toHaveURL(/\/feed$/);
});
