const PENDING_ADMIN_TWO_FACTOR_KEY = "admin_pending_two_factor";

export function savePendingAdminTwoFactor() {
  sessionStorage.setItem(PENDING_ADMIN_TWO_FACTOR_KEY, "1");
}

export function clearPendingAdminTwoFactor() {
  sessionStorage.removeItem(PENDING_ADMIN_TWO_FACTOR_KEY);
}

export function hasPendingAdminTwoFactor(): boolean {
  return sessionStorage.getItem(PENDING_ADMIN_TWO_FACTOR_KEY) === "1";
}
