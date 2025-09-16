import { useState } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      <Navbar onMenu={() => setOpen(true)} />
      <div className="container grid grid-cols-1 md:grid-cols-[16rem_1fr] gap-6 py-6">
        <Sidebar open={open} onClose={() => setOpen(false)} />
        <main>{children}</main>
      </div>
    </div>
  );
}
