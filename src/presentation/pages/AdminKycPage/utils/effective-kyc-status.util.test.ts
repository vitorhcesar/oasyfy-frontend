import { describe, expect, it } from "vitest";
import { effectiveKycStatus } from "./effective-kyc-status.util";

const base = {
  status: "pending",
  documents_status: "pending",
  bank_status: "pending",
  address_status: "pending",
};

describe("effectiveKycStatus", () => {
  it("returns pending when documents are not approved", () => {
    expect(effectiveKycStatus(base)).toBe("pending");
  });

  it("returns partially_approved when documents are approved", () => {
    expect(
      effectiveKycStatus({
        ...base,
        status: "approved",
        documents_status: "approved",
      }),
    ).toBe("partially_approved");
  });

  it("returns approved when every section is approved", () => {
    expect(
      effectiveKycStatus({
        status: "approved",
        documents_status: "approved",
        bank_status: "approved",
        address_status: "approved",
      }),
    ).toBe("approved");
  });

  it("returns rejected even if documents are approved", () => {
    expect(
      effectiveKycStatus({
        ...base,
        status: "rejected",
        documents_status: "approved",
      }),
    ).toBe("rejected");
  });
});
