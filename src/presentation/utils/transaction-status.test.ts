import { describe, expect, it } from "vitest";
import {
  displayedTransactionStatus,
  isExpiredUnpaidTransaction,
  matchesTransactionStatusFilter,
} from "./transaction-status";

describe("transaction-status", () => {
  it("shows unpaid expired PIX as pending", () => {
    const tx = {
      status: "failed",
      method: "pix",
      pix_code: "00020126...",
      metadata: {
        woovi_last_webhook: { event: "OPENPIX:CHARGE_EXPIRED" },
      },
    };

    expect(isExpiredUnpaidTransaction(tx)).toBe(true);
    expect(displayedTransactionStatus(tx)).toBe("pending");
    expect(matchesTransactionStatusFilter(tx, "pending")).toBe(true);
    expect(matchesTransactionStatusFilter(tx, "failed")).toBe(false);
  });

  it("keeps PIX generation failures as failed", () => {
    const tx = {
      status: "failed",
      method: "pix",
      pix_code: null,
      metadata: { pix_generation_failed: true },
    };

    expect(isExpiredUnpaidTransaction(tx)).toBe(false);
    expect(displayedTransactionStatus(tx)).toBe("failed");
    expect(matchesTransactionStatusFilter(tx, "failed")).toBe(true);
    expect(matchesTransactionStatusFilter(tx, "pending")).toBe(false);
  });

  it("does not treat still-pending PIX as expired", () => {
    const tx = {
      status: "pending",
      method: "pix",
      pix_code: "00020126...",
    };

    expect(isExpiredUnpaidTransaction(tx)).toBe(false);
    expect(displayedTransactionStatus(tx)).toBe("pending");
  });
});
