const SELLER_LOGIN_ERROR_KEY = "seller_portal_login_error";

export function saveSellerLoginError(message: string) {
  sessionStorage.setItem(SELLER_LOGIN_ERROR_KEY, message);
}

export function clearSellerLoginError() {
  sessionStorage.removeItem(SELLER_LOGIN_ERROR_KEY);
}

export function consumeSellerLoginError(): string | null {
  const message = sessionStorage.getItem(SELLER_LOGIN_ERROR_KEY);
  sessionStorage.removeItem(SELLER_LOGIN_ERROR_KEY);
  return message;
}
