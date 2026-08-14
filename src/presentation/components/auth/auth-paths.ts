export const LOGIN_PATH = "/login";

export function homePathForRole(role: "admin" | "seller"): "/admin" | "/seller" {
  return role === "admin" ? "/admin" : "/seller";
}
