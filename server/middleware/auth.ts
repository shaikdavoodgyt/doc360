import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

export interface AuthPayload {
  sub: string; // user id
  role: "admin" | "customer";
  customerId?: string | null;
}

declare global {
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function signToken(payload: AuthPayload) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET not configured");
  return jwt.sign(payload, secret, { expiresIn: "7d" });
}

export function authRequired(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return res.status(401).json({ error: "Missing token" });
  const token = auth.slice(7);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "") as AuthPayload;
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

export function requireRole(role: "admin" | "customer") {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    if (req.user.role !== role) return res.status(403).json({ error: "Forbidden" });
    next();
  };
}
