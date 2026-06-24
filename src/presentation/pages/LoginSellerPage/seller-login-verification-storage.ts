const PENDING_VERIFICATION_KEY = "seller_pending_email_verification";

export function savePendingVerification(email: string) {
  sessionStorage.setItem(PENDING_VERIFICATION_KEY, JSON.stringify({ email }));
}

export function clearPendingVerification() {
  sessionStorage.removeItem(PENDING_VERIFICATION_KEY);
}

export function loadPendingVerification(): { email: string } | null {
  try {
    const raw = sessionStorage.getItem(PENDING_VERIFICATION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as { email: string };
  } catch {
    return null;
  }
}
