export function hasSubmittedKycAddress(input: {
  zipCode?: string | null;
  street?: string | null;
}): boolean {
  return Boolean(input.zipCode?.trim() || input.street?.trim());
}

export function hasSubmittedKycBank(bankData: unknown): boolean {
  return bankData != null;
}

export function kycSectionDisplayStatus(
  status: string | null | undefined,
  hasSubmitted: boolean,
): string | null {
  if (!hasSubmitted) {
    return null;
  }

  return status || "pending";
}
