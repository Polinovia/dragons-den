import { test, expect } from "@playwright/test";
import { prisma } from "./db";
import { loginAs } from "./helpers";

let publicSketchId: string;
let privateSketchId: string;
let friendsSketchId: string;

test.beforeAll(async () => {
  const [publicSketch, privateSketch, friendsSketch] = await Promise.all([
    prisma.sketch.findFirstOrThrow({ where: { title: "The Night Train" } }),
    prisma.sketch.findFirstOrThrow({ where: { title: "Draft: the funeral that wasn't" } }),
    prisma.sketch.findFirstOrThrow({ where: { title: "Coastline, unfinished" } }),
  ]);
  publicSketchId = publicSketch.id;
  privateSketchId = privateSketch.id;
  friendsSketchId = friendsSketch.id;
});

test.afterAll(async () => {
  await prisma.$disconnect();
});

test("anonymous visitor can open a PUBLIC sketch directly", async ({ page }) => {
  await page.goto(`/sketches/${publicSketchId}`);
  await expect(page.getByRole("heading", { name: "The Night Train" })).toBeVisible();
});

test("anonymous visitor gets 404 on a PRIVATE sketch", async ({ page }) => {
  await page.goto(`/sketches/${privateSketchId}`);
  await expect(page.getByText("This page doesn't exist")).toBeVisible();
});

test("anonymous visitor gets 404 on a FRIENDS-only sketch", async ({ page }) => {
  await page.goto(`/sketches/${friendsSketchId}`);
  await expect(page.getByText("This page doesn't exist")).toBeVisible();
});

test("non-friend viewer gets 404 on a FRIENDS-only sketch", async ({ page }) => {
  // kit is not friends with theo in the seed data.
  await loginAs(page, "kit@example.com");
  await page.goto(`/sketches/${friendsSketchId}`);
  await expect(page.getByText("This page doesn't exist")).toBeVisible();
});

test("friend viewer can see a FRIENDS-only sketch", async ({ page }) => {
  // mira is friends with theo in the seed data.
  await loginAs(page, "mira@example.com");
  await page.goto(`/sketches/${friendsSketchId}`);
  await expect(page.getByRole("heading", { name: "Coastline, unfinished" })).toBeVisible();
});

test("owner sees their own PRIVATE sketch on their own profile", async ({ page }) => {
  await loginAs(page, "mira@example.com");
  await page.goto("/profile/mira");
  await expect(page.getByText("Draft: the funeral that wasn't")).toBeVisible();
});

test("explore shows zero non-public items when logged out", async ({ page }) => {
  await page.goto("/explore");
  await expect(page.getByText("Draft: the funeral that wasn't")).toHaveCount(0);
  await expect(page.getByText("Coastline, unfinished")).toHaveCount(0);
  await expect(page.getByText("The Night Train")).toBeVisible();
});
