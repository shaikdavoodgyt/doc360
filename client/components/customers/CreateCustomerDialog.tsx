import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { useData } from "@/context/DataContext";

export default function CreateCustomerDialog({ triggerClassName = "", onCreated }: { triggerClassName?: string; onCreated?: () => void }) {
  const { addCustomer } = useData();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [designation, setDesignation] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");

  function reset() {
    setName("");
    setDesignation("");
    setEmail("");
    setCompany("");
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !email) return;
    addCustomer({ name, designation, email, company });
    setOpen(false);
    reset();
    onCreated?.();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={"inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90 " + triggerClassName}>Create customer</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create customer</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleCreate} className="space-y-3">
          <div>
            <label className="block text-sm font-medium">Customer name</label>
            <input className="mt-1 w-full rounded-md border bg-background px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium">Designation</label>
            <input className="mt-1 w-full rounded-md border bg-background px-3 py-2" value={designation} onChange={(e) => setDesignation(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium">Email</label>
            <input type="email" className="mt-1 w-full rounded-md border bg-background px-3 py-2" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium">Company</label>
            <input className="mt-1 w-full rounded-md border bg-background px-3 py-2" value={company} onChange={(e) => setCompany(e.target.value)} />
          </div>
          <DialogFooter className="pt-2">
            <DialogClose asChild>
              <button type="button" className="rounded-md border px-4 py-2 text-sm">Cancel</button>
            </DialogClose>
            <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Create</button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
