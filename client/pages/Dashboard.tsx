import { useEffect, useState } from "react";
import { useData } from "@/context/DataContext";
import CreateCustomerDialog from "@/components/customers/CreateCustomerDialog";

interface StatCardProps {
  label: string;
  value: string | number;
}

function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
    </div>
  );
}

export default function Dashboard() {
  const [status, setStatus] = useState<string>("");
  const { customers, products } = useData();

  useEffect(() => {
    fetch("/api/ping").then((r) => r.json()).then((d) => setStatus(d.message)).catch(() => setStatus("offline"));
  }, []);

  const recent = customers.slice(0, 5);

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 rounded-2xl bg-gradient-to-br from-primary to-emerald-500 p-8 text-primary-foreground">
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="max-w-2xl text-white/90">Overview of your Customers activity. Create customers and manage products.</p>
        <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs">
          <span className="h-2 w-2 rounded-full bg-lime-300" />
          Server status: {status}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Customers" value={customers.length} />
        <StatCard label="Products" value={products.length} />
      </section>

      <section className="rounded-xl border bg-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Recent customers</h2>
            <p className="text-sm text-muted-foreground">Latest added customers</p>
          </div>
          <CreateCustomerDialog />
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="py-2">Name</th>
                <th className="py-2">Email</th>
                <th className="py-2">Company</th>
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 ? (
                <tr className="border-t">
                  <td className="py-6 text-muted-foreground" colSpan={4}>No customers yet. Create your first customer.</td>
                </tr>
              ) : (
                recent.map((c) => (
                  <tr key={c.id} className="border-t">
                    <td className="py-3 font-medium">{c.name}</td>
                    <td className="py-3">{c.email}</td>
                    <td className="py-3">{c.company || "-"}</td>
                    <td className="py-3"><span className="inline-flex items-center gap-2 rounded-full border px-2 py-0.5 text-xs"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />{c.status}</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
