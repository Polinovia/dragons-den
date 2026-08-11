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
    await page.getByRole("combobox", { name: "Security question" }).click();
    await page.getByRole("option", { name: "What was the name of your first pet?" }).click();
    await page.getByLabel("Answer").fill("Rex");
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
  const GENERIC_MESSAGE = "If that email has an account, we've sent a link to reset the password.";

  async function requestResetLink(page: import("@playwright/test").Page, email: string) {
    await page.goto("/forgot-password");
    await page.getByLabel("Email").fill(email);
    await page.getByRole("button", { name: "Send reset link" }).click();
    await expect(page.getByText(GENERIC_MESSAGE)).toBeVisible();
    // No RESEND_API_KEY in the test environment, so the action returns the
    // reset link directly instead of emailing it (see playwright.config.ts).
    const link = page.getByRole("link", { name: /\/reset-password\?token=/ });
    await expect(link).toBeVisible();
    const href = await link.getAttribute("href");
    if (!href) throw new Error("Expected a dev-mode reset link in the response.");
    return href;
  }

  test("unknown and known emails get the same generic response (no enumeration)", async ({ page }) => {
    await page.goto("/forgot-password");
    await page.getByLabel("Email").fill("nobody@example.com");
    await page.getByRole("button", { name: "Send reset link" }).click();
    await expect(page.getByText(GENERIC_MESSAGE)).toBeVisible();
    // Unknown email: no account, so no dev-mode link is shown.
    await expect(page.getByRole("link", { name: /\/reset-password\?token=/ })).toHaveCount(0);

    await requestResetLink(page, "kit@example.com");
  });

  test("reset link sets a new password, then logging in with it works", async ({ page }) => {
    const email = "sam@example.com";
    const newPassword = "brand-new-password-1";

    const href = await requestResetLink(page, email);
    await page.goto(href);
    await page.getByLabel("New password").fill(newPassword);
    await page.getByLabel("Confirm password").fill(newPassword);
    await page.getByRole("button", { name: "Set new password" }).click();

    await page.waitForURL("**/login");
    await loginAs(page, email, newPassword);
    await expect(page).toHaveURL(/\/feed$/);
  });

  test("a reset link can only be used once", async ({ page }) => {
    const email = "noor@example.com";
    const newPassword = "used-once-password-1";

    const href = await requestResetLink(page, email);
    await page.goto(href);
    await page.getByLabel("New password").fill(newPassword);
    await page.getByLabel("Confirm password").fill(newPassword);
    await page.getByRole("button", { name: "Set new password" }).click();
    await page.waitForURL("**/login");

    await page.goto(href);
    await page.getByLabel("New password").fill("second-attempt-password-1");
    await page.getByLabel("Confirm password").fill("second-attempt-password-1");
    await page.getByRole("button", { name: "Set new password" }).click();
    await expect(page.getByText("This reset link is invalid or has expired.")).toBeVisible();
  });

  test("mismatched passwords are rejected client-side", async ({ page }) => {
    const href = await requestResetLink(page, "jules@example.com");
    await page.goto(href);

    await page.getByLabel("New password").fill("password-one-1");
    await page.getByLabel("Confirm password").fill("password-two-2");
    await page.getByRole("button", { name: "Set new password" }).click();

    await expect(page.getByText("Passwords don't match.")).toBeVisible();
  });

  test("missing token shows an error with a way back", async ({ page }) => {
    await page.goto("/reset-password");
    await expect(page.getByText("This reset link is missing its token.")).toBeVisible();
    await expect(page.getByRole("link", { name: "Request a new link" })).toBeVisible();
  });

  test("garbage token is rejected on submit", async ({ page }) => {
    await page.goto("/reset-password?token=totally-made-up-garbage-token");
    await page.getByLabel("New password").fill("whatever-password-1");
    await page.getByLabel("Confirm password").fill("whatever-password-1");
    await page.getByRole("button", { name: "Set new password" }).click();
    await expect(page.getByText("This reset link is invalid or has expired.")).toBeVisible();
  });
});

test.describe("security question reset", () => {
  test("wrong answer is rejected", async ({ page }) => {
    await page.goto("/forgot-password/security-question");
    await page.getByLabel("Email").fill("theo@example.com");
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByText("What street did you grow up on?")).toBeVisible();

    await page.getByLabel("Answer").fill("Definitely Not Storgatan");
    await page.getByLabel("New password").fill("wont-work-password-1");
    await page.getByLabel("Confirm password").fill("wont-work-password-1");
    await page.getByRole("button", { name: "Set new password" }).click();
    await expect(page.getByText("That answer doesn't match.")).toBeVisible();
  });

  test("correct answer resets the password, then logging in with it works", async ({ page }) => {
    const email = "priya@example.com";
    const newPassword = "priya-security-reset-1";

    await page.goto("/forgot-password/security-question");
    await page.getByLabel("Email").fill(email);
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByText("Who was your favorite teacher?")).toBeVisible();

    await page.getByLabel("Answer").fill("Mrs Iyer");
    await page.getByLabel("New password").fill(newPassword);
    await page.getByLabel("Confirm password").fill(newPassword);
    await page.getByRole("button", { name: "Set new password" }).click();

    await page.waitForURL("**/login");
    await loginAs(page, email, newPassword);
    await expect(page).toHaveURL(/\/feed$/);
  });

  test("mismatched passwords are rejected client-side", async ({ page }) => {
    await page.goto("/forgot-password/security-question");
    await page.getByLabel("Email").fill("kit@example.com");
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByText("What street did you grow up on?")).toBeVisible();

    await page.getByLabel("Answer").fill("Elm Close");
    await page.getByLabel("New password").fill("password-one-1");
    await page.getByLabel("Confirm password").fill("password-two-2");
    await page.getByRole("button", { name: "Set new password" }).click();
    await expect(page.getByText("Passwords don't match.")).toBeVisible();
  });

  test("unknown email shows not-found message", async ({ page }) => {
    await page.goto("/forgot-password/security-question");
    await page.getByLabel("Email").fill("nobody@example.com");
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByText("No account with that email.")).toBeVisible();
  });
});

test("original demo password still works for an untouched account", async ({ page }) => {
  await loginAs(page, "ana@example.com", DEMO_PASSWORD);
  await expect(page).toHaveURL(/\/feed$/);
});
