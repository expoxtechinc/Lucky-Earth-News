import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  user?: { id: string; username: string; role: string };
}

export function protect(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (!token) {
    res.status(401).json({ message: "No token, authorization denied" });
    return;
  }

  const secret = process.env["JWT_SECRET"];
  if (!secret) {
    res.status(500).json({ message: "JWT_SECRET not configured" });
    return;
  }

  try {
    const decoded = jwt.verify(token, secret) as { id: string; username: string; role: string };
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: "Token is not valid" });
  }
}

export function adminOnly(req: AuthRequest, res: Response, next: NextFunction): void {
  if (req.user?.role !== "admin") {
    res.status(403).json({ message: "Admin access required" });
    return;
  }
  next();
}
