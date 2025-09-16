import { Router, Request, Response } from "express";
import { Customer } from "../models/Customer";
import { authRequired } from "../middleware/auth";
import { requireDB } from "../utils/db";

export const customersRouter = Router();

// List with search + pagination
customersRouter.get("/", requireDB, authRequired, async (req: Request, res: Response) => {
  const q = String(req.query.q || "").trim();
  const page = Math.max(1, parseInt(String(req.query.page || "1"), 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(String(req.query.pageSize || "10"), 10)));

  const filter: any = {};
  if (q) {
    filter.$or = [
      { name: { $regex: q, $options: "i" } },
      { email: { $regex: q, $options: "i" } },
      { company: { $regex: q, $options: "i" } },
    ];
  }
  // If customer role, only allow their own record
  if (req.user?.role === "customer" && req.user.customerId) {
    filter._id = req.user.customerId;
  }

  const total = await Customer.countDocuments(filter);
  const items = await Customer.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .lean();

  res.json({ items, page, pageSize, total, totalPages: Math.ceil(total / pageSize) });
});

// Create (admin only)
customersRouter.post("/", requireDB, authRequired, async (req: Request, res: Response) => {
  if (req.user?.role !== "admin") return res.status(403).json({ error: "Forbidden" });
  const doc = await Customer.create(req.body);
  res.status(201).json(doc);
});

// Read one
customersRouter.get("/:id", requireDB, authRequired, async (req, res) => {
  const id = req.params.id;
  if (req.user?.role === "customer" && req.user.customerId !== id) return res.status(403).json({ error: "Forbidden" });
  const doc = await Customer.findById(id);
  if (!doc) return res.status(404).json({ error: "Not found" });
  res.json(doc);
});

// Update (admin only)
customersRouter.put("/:id", requireDB, authRequired, async (req, res) => {
  if (req.user?.role !== "admin") return res.status(403).json({ error: "Forbidden" });
  const doc = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!doc) return res.status(404).json({ error: "Not found" });
  res.json(doc);
});

// Delete (admin only)
customersRouter.delete("/:id", requireDB, authRequired, async (req, res) => {
  if (req.user?.role !== "admin") return res.status(403).json({ error: "Forbidden" });
  await Customer.findByIdAndDelete(req.params.id);
  res.status(204).end();
});
