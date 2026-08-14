import { describe, expect, it } from "vitest";
import {
  hasSubmittedKycAddress,
  hasSubmittedKycBank,
  kycSectionDisplayStatus,
} from "./kyc-section-display-status.util";

describe("hasSubmittedKycAddress", () => {
  it("returns false when address fields are empty", () => {
    expect(hasSubmittedKycAddress({})).toBe(false);
    expect(hasSubmittedKycAddress({ zipCode: null, street: null })).toBe(false);
    expect(hasSubmittedKycAddress({ zipCode: "", street: "  " })).toBe(false);
  });

  it("returns true when zip code or street is present", () => {
    expect(hasSubmittedKycAddress({ zipCode: "01310-100" })).toBe(true);
    expect(hasSubmittedKycAddress({ street: "Av. Paulista" })).toBe(true);
  });
});

describe("hasSubmittedKycBank", () => {
  it("returns false when bank data is missing", () => {
    expect(hasSubmittedKycBank(null)).toBe(false);
    expect(hasSubmittedKycBank(undefined)).toBe(false);
  });

  it("returns true when bank data exists", () => {
    expect(hasSubmittedKycBank({ bankName: "Nubank" })).toBe(true);
  });
});

describe("kycSectionDisplayStatus", () => {
  it("hides pending status until the section is submitted", () => {
    expect(kycSectionDisplayStatus("pending", false)).toBeNull();
    expect(kycSectionDisplayStatus("approved", false)).toBeNull();
  });

  it("returns the real status after the section is submitted", () => {
    expect(kycSectionDisplayStatus("pending", true)).toBe("pending");
    expect(kycSectionDisplayStatus("approved", true)).toBe("approved");
    expect(kycSectionDisplayStatus("rejected", true)).toBe("rejected");
  });
});
