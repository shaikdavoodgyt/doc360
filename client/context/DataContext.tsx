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
  addProduct: (p: { customerId: string; name: string; desc?: string }) => Product;
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

  function addProduct(input: { customerId: string; name: string; desc?: string }): Product {
    const now = new Date().toISOString();
    const slug = input.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
    const p: Product = {
      id: crypto.randomUUID(),
      customerId: input.customerId,
      name: input.name,
      slug,
      desc: input.desc,
      createdAt: now,
      updatedAt: now,
    };
    setProducts((prev) => [p, ...prev]);
    return p;
  }

  const value = useMemo<DataState>(
    () => ({ customers, products, addCustomer, addProduct }),
    [customers, products]
  );

  return <DataCtx.Provider value={value}>{children}</DataCtx.Provider>;
}

export function useData() {
  const ctx = useContext(DataCtx);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
