import { Request, Response, Router } from "express";
import bcrypt from "bcryptjs";
import { User } from "../models/User";
import { signToken } from "../middleware/auth";
import { requireDB } from "../utils/db";

export const authRouter = Router();

// POST /api/auth/login
authRouter.post("/login", requireDB, async (req: Request, res: Response) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "Email and password required" });
  const user = await User.findOne({ email }).lean();
  if (!user) return res.status(401).json({ error: "Invalid credentials" });
  const ok = await bcrypt.compare(password, user.pwdHash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });
  const token = signToken({ sub: String(user._id), role: user.role, customerId: user.customerId ? String(user.customerId) : null });
  res.json({ token, role: user.role, customerId: user.customerId ?? null, user: { id: String(user._id), name: user.name, email: user.email } });
});
