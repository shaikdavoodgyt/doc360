import { useMemo, useState } from "react";
import { useData } from "@/context/DataContext";
import CreateCustomerDialog from "@/components/customers/CreateCustomerDialog";

export default function Customers() {
  const { customers } = useData();
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return customers;
    return customers.filter((c) =>
      [c.name, c.email, c.company, c.designation].some((v) => (v || "").toLowerCase().includes(term))
    );
  }, [q, customers]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Customers</h1>
        <CreateCustomerDialog />
      </div>

      <div className="flex items-center justify-between gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search customers..."
          className="w-full max-w-md rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
        />
        <div className="text-sm text-muted-foreground">Total: {filtered.length}</div>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted-foreground">
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Designation</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Company</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Created</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-muted-foreground" colSpan={6}>No customers found.</td>
              </tr>
            ) : (
              filtered.map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3">{c.designation || "-"}</td>
                  <td className="px-4 py-3">{c.email}</td>
                  <td className="px-4 py-3">{c.company || "-"}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-2 rounded-full border px-2 py-0.5 text-xs">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />{c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">{new Date(c.createdAt).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
