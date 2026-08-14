import { describe, expect, it } from "vitest";
import {
  getSaleSplitDetails,
  hasSaleSplitMetadata,
  isSplitCreditMetadata,
} from "./transaction-split";

describe("transaction-split", () => {
  const saleMeta = {
    split_source: "partners",
    split_settled_at: "2026-08-14T18:00:00.000Z",
    split: {
      base: "net",
      base_amount: 915,
      seller_amount: 640,
      seller_percentage: 70,
      breakdown: [
        {
          account_id: "OAS-PARTNER01",
          percentage: 30,
          amount: 275,
          description: "Sócio",
        },
      ],
    },
  };

  it("detects split_credit ledger rows", () => {
    expect(
      isSplitCreditMetadata({
        type: "split_credit",
        parent_transaction_id: 10,
      }),
    ).toBe(true);
    expect(isSplitCreditMetadata(saleMeta)).toBe(false);
  });

  it("reads sale split breakdown from the parent transaction", () => {
    expect(hasSaleSplitMetadata(saleMeta)).toBe(true);
    expect(getSaleSplitDetails(saleMeta)).toEqual({
      sellerAmount: 640,
      sellerPercentage: 70,
      partnerAmount: 275,
      baseAmount: 915,
      base: "net",
      breakdown: [
        {
          accountId: "OAS-PARTNER01",
          amount: 275,
          percentage: 30,
          fixedAmount: null,
          description: "Sócio",
        },
      ],
      settledAt: "2026-08-14T18:00:00.000Z",
      skipped: [],
      source: "partners",
    });
  });

  it("does not treat split_credit as a sale with split", () => {
    expect(
      getSaleSplitDetails({
        type: "split_credit",
        split: { breakdown: [{ account_id: "X", amount: 1 }] },
      }),
    ).toBeNull();
  });
});
