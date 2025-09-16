import { Router, Request, Response } from "express";
import { Page } from "../models/Page";
import { Product } from "../models/Product";
import { authRequired } from "../middleware/auth";
import { requireDB } from "../utils/db";
import { slugify } from "../utils/slugify";

export const pagesRouter = Router();

// List pages by productId
pagesRouter.get("/", requireDB, authRequired, async (req: Request, res: Response) => {
  const productId = String(req.query.productId || "");
  if (!productId) return res.status(400).json({ error: "productId required" });
  const product = await Product.findById(productId);
  if (!product) return res.status(404).json({ error: "Product not found" });
  if (req.user?.role === "customer" && String(product.customerId) !== req.user.customerId) return res.status(403).json({ error: "Forbidden" });
  const items = await Page.find({ productId }).sort({ createdAt: -1 }).lean();
  res.json(items);
});

// Create
pagesRouter.post("/", requireDB, authRequired, async (req, res) => {
  const body = req.body || {};
  if (!body.productId) return res.status(400).json({ error: "productId required" });
  const product = await Product.findById(body.productId);
  if (!product) return res.status(404).json({ error: "Product not found" });
  if (req.user?.role === "customer" && String(product.customerId) !== req.user.customerId) return res.status(403).json({ error: "Forbidden" });
  body.slug = body.slug ? slugify(body.slug) : slugify(body.title || "");
  const created = await Page.create(body);
  res.status(201).json(created);
});

// Read one
pagesRouter.get("/:id", requireDB, authRequired, async (req, res) => {
  const page = await Page.findById(req.params.id);
  if (!page) return res.status(404).json({ error: "Not found" });
  const product = await Product.findById(page.productId);
  if (!product) return res.status(404).json({ error: "Product not found" });
  if (req.user?.role === "customer" && String(product.customerId) !== req.user.customerId) return res.status(403).json({ error: "Forbidden" });
  res.json(page);
});

// Update
pagesRouter.put("/:id", requireDB, authRequired, async (req, res) => {
  const page = await Page.findById(req.params.id);
  if (!page) return res.status(404).json({ error: "Not found" });
  const product = await Product.findById(page.productId);
  if (!product) return res.status(404).json({ error: "Product not found" });
  if (req.user?.role === "customer" && String(product.customerId) !== req.user.customerId) return res.status(403).json({ error: "Forbidden" });
  const body = req.body || {};
  if (body.title && !body.slug) body.slug = slugify(body.title);
  const updated = await Page.findByIdAndUpdate(req.params.id, body, { new: true });
  res.json(updated);
});

// Delete
pagesRouter.delete("/:id", requireDB, authRequired, async (req, res) => {
  const page = await Page.findById(req.params.id);
  if (!page) return res.status(404).json({ error: "Not found" });
  const product = await Product.findById(page.productId);
  if (!product) return res.status(404).json({ error: "Product not found" });
  if (req.user?.role === "customer" && String(product.customerId) !== req.user.customerId) return res.status(403).json({ error: "Forbidden" });
  await Page.findByIdAndDelete(page._id);
  res.status(204).end();
});
