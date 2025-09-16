import { Link, NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", label: "Dashboard" },
  { to: "/customers", label: "Customers" },
  { to: "/products", label: "Products" },
  { to: "/editor", label: "Editor" },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:bg-background/80">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold">D</span>
            <span className="text-xl font-semibold tracking-tight">Docu360</span>
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "transition-colors hover:text-foreground/80 text-foreground/60",
                    isActive && "text-foreground font-medium"
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="container py-8">{children}</main>
      <footer className="mt-12 border-t py-6 text-center text-sm text-muted-foreground">© {new Date().getFullYear()} Docu360 • Knowledge base platform</footer>
    </div>
  );
}
