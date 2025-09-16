import { Router } from "express";
import { Product } from "../models/Product";

export const publishedRouter = Router();

publishedRouter.get("/:id/download", async (req, res) => {
  const product = await Product.findById(req.params.id).lean();
  if (!product?.publishedHtml) return res.status(404).json({ error: "Not found" });
  res.setHeader("Content-Disposition", `attachment; filename=product-${req.params.id}.html`);
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(product.publishedHtml);
});
