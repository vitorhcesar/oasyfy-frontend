import { expect, test } from "@playwright/test";

test.describe("Public pages", () => {
  test("seller login page renders", async ({ page }) => {
    await page.goto("/login/seller");

    await expect(page.getByRole("heading", { name: "Entrar" })).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Email" })).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Senha" })).toBeVisible();
  });

  test("admin login page renders", async ({ page }) => {
    await page.goto("/login/admin");

    await expect(page.getByText("OmegaPay Admin")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Entrar como Admin/i }),
    ).toBeVisible();
  });

  test("unknown route redirects to seller login", async ({ page }) => {
    await page.goto("/rota-inexistente");

    await expect(page).toHaveURL(/\/login\/seller$/);
  });
});
