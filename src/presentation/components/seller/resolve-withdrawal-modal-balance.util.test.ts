import { describe, expect, it } from "vitest";
import { resolveWithdrawalModalBalance } from "./resolve-withdrawal-modal-balance.util";

describe("resolveWithdrawalModalBalance", () => {
  it("uses total available when the card tab is hidden", () => {
    expect(
      resolveWithdrawalModalBalance({
        showCardBalanceTab: false,
        tab: "pix_boleto",
        availableBalance: 900,
        cardBalance: 900,
        pixBoletoBalance: 0,
      }),
    ).toBe(900);
  });

  it("uses the selected bucket when the card tab is visible", () => {
    expect(
      resolveWithdrawalModalBalance({
        showCardBalanceTab: true,
        tab: "pix_boleto",
        availableBalance: 900,
        cardBalance: 900,
        pixBoletoBalance: 0,
      }),
    ).toBe(0);

    expect(
      resolveWithdrawalModalBalance({
        showCardBalanceTab: true,
        tab: "card",
        availableBalance: 900,
        cardBalance: 900,
        pixBoletoBalance: 0,
      }),
    ).toBe(900);
  });

  it("never returns a negative balance", () => {
    expect(
      resolveWithdrawalModalBalance({
        showCardBalanceTab: false,
        tab: "pix_boleto",
        availableBalance: -100,
        cardBalance: 0,
        pixBoletoBalance: 0,
      }),
    ).toBe(0);
  });
});
