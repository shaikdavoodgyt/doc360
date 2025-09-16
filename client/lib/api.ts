export type LoginResponse = { token: string; role: "admin" | "customer"; customerId?: string | null; user: { id: string; name: string; email: string } };

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";
const META_KEY = "auth_meta";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}
export function setUser(user: LoginResponse["user"] | null) {
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  else localStorage.removeItem(USER_KEY);
}
export function getUser(): LoginResponse["user"] | null {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? (JSON.parse(raw) as LoginResponse["user"]) : null;
}
export function setMeta(meta: { role: "admin" | "customer"; customerId?: string | null } | null) {
  if (meta) localStorage.setItem(META_KEY, JSON.stringify(meta));
  else localStorage.removeItem(META_KEY);
}
export function getMeta(): { role: "admin" | "customer"; customerId?: string | null } | null {
  const raw = localStorage.getItem(META_KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function apiFetch<T>(input: RequestInfo, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers || {});
  headers.set("Content-Type", "application/json");
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch(input, { ...init, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Request failed with ${res.status}`);
  }
  return res.json();
}
