import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function Navbar({ onMenu }: { onMenu: () => void }) {
  const { user, role, logout } = useAuth();

  useEffect(() => {
    function onLogout() { logout(); }
    window.addEventListener("app:logout", onLogout);
    return () => window.removeEventListener("app:logout", onLogout);
  }, [logout]);

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:bg-background/80">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-3">
          <button className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-md border" aria-label="Open menu" onClick={onMenu}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
          </button>
          <Link to="/dashboard" className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold">D</span>
            <span className="text-lg font-semibold tracking-tight">Docu360</span>
          </Link>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex items-center gap-2 rounded-md border bg-background px-3 py-1.5 text-sm">
            <div className="flex flex-col items-start leading-tight">
              <span className="font-medium">{user?.name || "John"}</span>
              <span className="text-xs text-muted-foreground">{role || "Admin"}</span>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Signed in</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/profile">Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={logout}>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
