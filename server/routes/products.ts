import { Router, Request, Response } from "express";
import { Product } from "../models/Product";
import { Page } from "../models/Page";
import { authRequired } from "../middleware/auth";
import { requireDB } from "../utils/db";
import { slugify } from "../utils/slugify";
import fs from "fs/promises";
import path from "path";

export const productsRouter = Router();

// List products
productsRouter.get("/", requireDB, authRequired, async (req: Request, res: Response) => {
  const filter: any = {};
  if (req.user?.role === "customer" && req.user.customerId) {
    filter.customerId = req.user.customerId;
  } else if (req.query.customerId) {
    filter.customerId = req.query.customerId;
  }
  const items = await Product.find(filter).sort({ updatedAt: -1 }).lean();
  res.json(items);
});

// Create product
productsRouter.post("/", requireDB, authRequired, async (req, res) => {
  const body = req.body || {};
  if (req.user?.role === "customer") {
    body.customerId = req.user.customerId;
  }
  if (!body.customerId) return res.status(400).json({ error: "customerId required" });
  body.slug = body.slug ? slugify(body.slug) : slugify(body.name || "");
  const created = await Product.create(body);
  res.status(201).json(created);
});

// Read
productsRouter.get("/:id", requireDB, authRequired, async (req, res) => {
  const doc = await Product.findById(req.params.id);
  if (!doc) return res.status(404).json({ error: "Not found" });
  if (req.user?.role === "customer" && String(doc.customerId) !== req.user.customerId) return res.status(403).json({ error: "Forbidden" });
  res.json(doc);
});

// Update
productsRouter.put("/:id", requireDB, authRequired, async (req, res) => {
  const existing = await Product.findById(req.params.id);
  if (!existing) return res.status(404).json({ error: "Not found" });
  if (req.user?.role === "customer" && String(existing.customerId) !== req.user.customerId) return res.status(403).json({ error: "Forbidden" });
  const body = req.body || {};
  if (body.name && !body.slug) body.slug = slugify(body.name);
  const updated = await Product.findByIdAndUpdate(req.params.id, body, { new: true });
  res.json(updated);
});

// Delete
productsRouter.delete("/:id", requireDB, authRequired, async (req, res) => {
  const existing = await Product.findById(req.params.id);
  if (!existing) return res.status(404).json({ error: "Not found" });
  if (req.user?.role === "customer" && String(existing.customerId) !== req.user.customerId) return res.status(403).json({ error: "Forbidden" });
  await Page.deleteMany({ productId: existing._id });
  await Product.findByIdAndDelete(existing._id);
  res.status(204).end();
});

// Publish: build static HTML and save file
productsRouter.post("/:id/publish", requireDB, authRequired, async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ error: "Not found" });
  if (req.user?.role === "customer" && String(product.customerId) !== req.user.customerId) return res.status(403).json({ error: "Forbidden" });

  const pages = await Page.find({ productId: product._id }).sort({ title: 1 }).lean();
  const html = buildStaticHtml(product.name, pages);

  const fileName = `${String(product._id)}.html`;
  const dir = path.resolve("public", "published");
  await fs.mkdir(dir, { recursive: true });
  const filePath = path.join(dir, fileName);
  await fs.writeFile(filePath, html, "utf-8");

  product.published = true;
  product.publishedUrl = `/published/${fileName}`;
  product.publishedHtml = html;
  await product.save();

  res.json({ hostedUrl: product.publishedUrl, htmlDownloadUrl: `/api/published/${String(product._id)}/download` });
});

function buildStaticHtml(title: string, pages: Array<{ title: string; slug: string; contentHtml: string }>) {
  const navLinks = pages
    .map((p) => `<li><a href="#${p.slug}">${escapeHtml(p.title)}</a></li>`) 
    .join("");
  const sections = pages
    .map(
      (p) => `<section id="${p.slug}" style="padding:40px 0;border-top:1px solid #e5e7eb;">
  <h2 style="font-size:24px;margin-bottom:12px;">${escapeHtml(p.title)}</h2>
  <div>${p.contentHtml || ""}</div>
</section>`
    )
    .join("");
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    body{font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,sans-serif;margin:0;padding:0;color:#111827}
    header{position:sticky;top:0;background:#111827;color:white;padding:16px 24px;z-index:10}
    .container{max-width:960px;margin:0 auto;padding:0 24px}
    nav ul{list-style:none;display:flex;gap:16px;padding:0;margin:0}
    a{color:#2563eb;text-decoration:none}
    a:hover{text-decoration:underline}
  </style>
</head>
<body>
  <header><div class="container"><strong>${escapeHtml(title)}</strong></div></header>
  <main class="container" style="padding:24px 0;">
    <aside style="float:right;width:240px;padding-left:24px;">
      <nav><ul>${navLinks}</ul></nav>
    </aside>
    <article style="margin-right:264px;">${sections}</article>
  </main>
</body>
</html>`;
}

function escapeHtml(str: string) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
