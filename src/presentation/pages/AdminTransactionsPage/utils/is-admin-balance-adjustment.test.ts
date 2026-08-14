import { describe, expect, it } from "vitest";
import { isAdminBalanceAdjustment } from "./is-admin-balance-adjustment";

describe("isAdminBalanceAdjustment", () => {
  it("detects metadata flags", () => {
    expect(
      isAdminBalanceAdjustment({
        customer_name: "Cliente",
        metadata: { admin_adjustment: true },
      }),
    ).toBe(true);
  });

  it("detects the administrative customer name", () => {
    expect(
      isAdminBalanceAdjustment({
        customer_name: "Ajuste administrativo",
        metadata: {},
      }),
    ).toBe(true);
  });

  it("ignores regular sales", () => {
    expect(
      isAdminBalanceAdjustment({
        customer_name: "Cliente",
        metadata: { split: { seller_amount: 100 } },
      }),
    ).toBe(false);
  });
});
