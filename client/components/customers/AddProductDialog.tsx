import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { useData } from "@/context/DataContext";
import { useNavigate } from "react-router-dom";

export default function AddProductDialog({ customerId, triggerClassName = "" }: { customerId: string; triggerClassName?: string }) {
  const { addProduct } = useData();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const navigate = useNavigate();

  function reset() {
    setName("");
    setDesc("");
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name) return;
    const p = addProduct({ customerId, name, desc });
    setOpen(false);
    reset();
    navigate(`/editor?productId=${encodeURIComponent(p.id)}`);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={"inline-flex h-8 items-center rounded-md border px-3 text-xs font-medium hover:bg-accent " + triggerClassName}>Add product</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create product</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleCreate} className="space-y-3">
          <div>
            <label className="block text-sm font-medium">Document name</label>
            <input className="mt-1 w-full rounded-md border bg-background px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium">Description</label>
            <textarea className="mt-1 w-full rounded-md border bg-background px-3 py-2" rows={3} value={desc} onChange={(e) => setDesc(e.target.value)} />
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
