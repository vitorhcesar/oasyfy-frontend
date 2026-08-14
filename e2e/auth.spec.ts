import { test, expect } from "@playwright/test";

const adminEmail = process.env.PLAYWRIGHT_ADMIN_EMAIL;
const adminPassword = process.env.PLAYWRIGHT_ADMIN_PASSWORD;

test.describe("Authenticated admin", () => {
  test.skip(
    !adminEmail || !adminPassword,
    "Requires PLAYWRIGHT_ADMIN_EMAIL and PLAYWRIGHT_ADMIN_PASSWORD",
  );

  test("admin can sign in and reach dashboard", async ({ page }) => {
    await page.goto("/login");

    await page.getByRole("textbox", { name: "Email" }).fill(adminEmail!);
    await page.getByRole("textbox", { name: "Senha" }).fill(adminPassword!);
    await page.getByRole("button", { name: /^Entrar$/ }).click();

    await expect(page).toHaveURL(/\/admin(?:\/|$)/, { timeout: 15_000 });
  });
});
