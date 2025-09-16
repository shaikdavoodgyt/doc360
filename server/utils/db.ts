import mongoose from "mongoose";

let isConnecting = false;
let isConnected = false;

export async function connectMongo() {
  if (isConnected || isConnecting) return;
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn("MONGODB_URI not set. API endpoints will be unavailable until you connect a database.");
    return;
  }
  try {
    isConnecting = true;
    await mongoose.connect(uri, {
      dbName: process.env.MONGODB_DB || undefined,
    });
    isConnected = true;
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection error:", err);
  } finally {
    isConnecting = false;
  }
}

export function requireDB(req: any, res: any, next: any) {
  if (!process.env.MONGODB_URI) {
    return res.status(503).json({ error: "Database not configured. Set MONGODB_URI env to enable API." });
  }
  if (!isConnected && !isConnecting) {
    connectMongo().then(() => next()).catch((e) => {
      console.error(e);
      res.status(500).json({ error: "Failed to connect to database" });
    });
    return;
  }
  next();
}
