import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation() as any;
  const from = location.state?.from?.pathname || "/dashboard";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-2">
      <div className="hidden md:flex flex-col justify-between bg-gradient-to-br from-primary to-emerald-500 p-10 text-primary-foreground">
        <div className="text-xl font-semibold">Docu360</div>
        <div>
          <h1 className="text-3xl font-bold">Welcome back</h1>
          <p className="mt-2 text-white/90">Sign in to manage your knowledge base.</p>
        </div>
        <p className="text-xs text-white/80">© {new Date().getFullYear()} Docu360</p>
      </div>
      <div className="flex items-center justify-center p-6">
        <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4">
          <div className="flex items-center gap-2">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold">D</div>
            <div>
              <div className="text-lg font-semibold">Sign in</div>
              <div className="text-xs text-muted-foreground">Admin or Customer</div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-md border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-primary" placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium">Password</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-md border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-primary" placeholder="••••••••" />
          </div>
          {error ? <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div> : null}
          <button type="submit" disabled={loading} className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
