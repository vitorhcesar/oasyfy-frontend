import { expect, test } from "@playwright/test";

test.describe("Public pages", () => {
  test("login page renders", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByRole("heading", { name: "Entrar" })).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Email" })).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Senha" })).toBeVisible();
  });

  test("legacy admin login path redirects to /login", async ({ page }) => {
    await page.goto("/login/admin");

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { name: "Entrar" })).toBeVisible();
  });

  test("legacy seller login path redirects to /login", async ({ page }) => {
    await page.goto("/login/seller");

    await expect(page).toHaveURL(/\/login$/);
  });

  test("unknown route redirects to login", async ({ page }) => {
    await page.goto("/rota-inexistente");

    await expect(page).toHaveURL(/\/login$/);
  });
});
