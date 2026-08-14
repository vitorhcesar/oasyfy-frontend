import { describe, expect, it } from "vitest";
import {
  describePixAmountLimits,
  getPixAmountLimitError,
  resolvePixMaxAmountCents,
  resolvePixMinAmountCents,
} from "./pix-amount-limits.util";

describe("pix-amount-limits.util", () => {
  it("uses R$ 1,00 as default minimum when platform min is disabled", () => {
    expect(resolvePixMinAmountCents(0)).toBe(100);
    expect(resolvePixMinAmountCents(undefined)).toBe(100);
  });

  it("converts platform min from reais to cents", () => {
    expect(resolvePixMinAmountCents(10)).toBe(1000);
  });

  it("treats 0 max as unlimited", () => {
    expect(resolvePixMaxAmountCents(0)).toBeNull();
    expect(resolvePixMaxAmountCents(400)).toBe(40000);
  });

  it("returns min error below the floor", () => {
    expect(getPixAmountLimitError(50, 0, 0)).toBe("Valor mínimo: R$ 1,00");
    expect(getPixAmountLimitError(500, 10, 0)).toBe("Valor mínimo: R$ 10,00");
  });

  it("returns max error above the platform maximum", () => {
    expect(getPixAmountLimitError(40100, 1, 400)).toBe(
      "Valor máximo: R$ 400,00",
    );
  });

  it("describes the allowed range", () => {
    expect(describePixAmountLimits(0, 0)).toBe("Valor mínimo: R$ 1,00.");
    expect(describePixAmountLimits(1, 400)).toBe(
      "Valor entre R$ 1,00 e R$ 400,00.",
    );
  });
});
