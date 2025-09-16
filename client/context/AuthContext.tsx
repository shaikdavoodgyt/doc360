import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiFetch, getToken, getUser, setToken, setUser, setMeta, getMeta, type LoginResponse } from "@/lib/api";

interface AuthState {
  user: LoginResponse["user"] | null;
  role: "admin" | "customer" | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthCtx = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<AuthState["user"]>(null);
  const [role, setRole] = useState<AuthState["role"]>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = getToken();
    const u = getUser();
    const m = getMeta();
    if (t && u) {
      setTokenState(t);
      setUserState(u);
      setRole(m?.role || null);
    }
    setLoading(false);
  }, []);

  async function login(email: string, password: string) {
    const data = await apiFetch<LoginResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setToken(data.token);
    setUser(data.user);
    setMeta({ role: data.role, customerId: data.customerId ?? null });
    setTokenState(data.token);
    setUserState(data.user);
    setRole(data.role);
  }

  function logout() {
    setToken(null);
    setUser(null);
    setMeta(null);
    setTokenState(null);
    setUserState(null);
    setRole(null);
  }

  const value = useMemo<AuthState>(
    () => ({ user, role, token, loading, login, logout }),
    [user, role, token, loading]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
