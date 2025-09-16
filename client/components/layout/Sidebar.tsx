import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

const links = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/customers", label: "Customers" },
  { to: "/products", label: "Products" },
  { to: "/users", label: "Users" },
  { to: "/profile", label: "Profile" },
];

export default function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <>
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 -translate-x-full border-r bg-white p-4 transition-transform md:static md:translate-x-0 dark:bg-background",
        open && "translate-x-0"
      )}>
        <nav className="space-y-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  "block rounded-md px-3 py-2 text-sm text-foreground/70 hover:bg-accent hover:text-foreground",
                  isActive && "bg-accent text-foreground"
                )
              }
            >
              {l.label}
            </NavLink>
          ))}
          <button onClick={() => {
            const ev = new CustomEvent("app:logout");
            window.dispatchEvent(ev);
            onClose();
          }} className="mt-4 block w-full rounded-md px-3 py-2 text-left text-sm text-destructive hover:bg-destructive/10">Logout</button>
        </nav>
      </aside>
      {open && <div className="fixed inset-0 z-30 bg-black/30 md:hidden" onClick={onClose} />}
    </>
  );
}
