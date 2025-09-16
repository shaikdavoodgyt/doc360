import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Customer = {
  id: string;
  name: string;
  designation?: string;
  email: string;
  company?: string;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
};

export type Product = {
  id: string;
  customerId: string;
  name: string;
  slug: string;
  desc?: string;
  createdAt: string;
  updatedAt: string;
};

interface DataState {
  customers: Customer[];
  products: Product[];
  addCustomer: (c: Omit<Customer, "id" | "status" | "createdAt" | "updatedAt">) => Customer;
}

const DataCtx = createContext<DataState | undefined>(undefined);

const LS_KEY = "docu360_data";

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setCustomers(parsed.customers || []);
        setProducts(parsed.products || []);
      }
    } catch {}
  }, []);

  useEffect(() => {
    const payload = JSON.stringify({ customers, products });
    localStorage.setItem(LS_KEY, payload);
  }, [customers, products]);

  function addCustomer(input: Omit<Customer, "id" | "status" | "createdAt" | "updatedAt">): Customer {
    const now = new Date().toISOString();
    const c: Customer = {
      id: crypto.randomUUID(),
      status: "active",
      createdAt: now,
      updatedAt: now,
      ...input,
    };
    setCustomers((prev) => [c, ...prev]);
    return c;
  }

  const value = useMemo<DataState>(
    () => ({ customers, products, addCustomer }),
    [customers, products]
  );

  return <DataCtx.Provider value={value}>{children}</DataCtx.Provider>;
}

export function useData() {
  const ctx = useContext(DataCtx);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
