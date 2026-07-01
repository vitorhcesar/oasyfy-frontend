const PENDING_TWO_FACTOR_KEY = "seller_pending_two_factor";

export function savePendingTwoFactor(email: string) {
  sessionStorage.setItem(PENDING_TWO_FACTOR_KEY, JSON.stringify({ email }));
}

export function clearPendingTwoFactor() {
  sessionStorage.removeItem(PENDING_TWO_FACTOR_KEY);
}

export function loadPendingTwoFactor(): { email: string } | null {
  try {
    const raw = sessionStorage.getItem(PENDING_TWO_FACTOR_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as { email: string };
  } catch {
    return null;
  }
}
