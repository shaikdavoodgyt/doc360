import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { handleDemo } from "./routes/demo";
import { connectMongo } from "./utils/db";
import { authRouter } from "./routes/auth";
import { customersRouter } from "./routes/customers";
import { productsRouter } from "./routes/products";
import { pagesRouter } from "./routes/pages";
import { publishedRouter } from "./routes/published";

export function createServer() {
  const app = express();

  // Attempt DB connection (non-blocking)
  connectMongo();

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));

  // Static hosting for published docs
  app.use("/published", express.static(path.resolve("public", "published")));

  // Health and demo
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });
  app.get("/api/demo", handleDemo);

  // APIs
  app.use("/api/auth", authRouter);
  app.use("/api/customers", customersRouter);
  app.use("/api/products", productsRouter);
  app.use("/api/pages", pagesRouter);
  app.use("/api/published", publishedRouter);

  return app;
}
