import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User";
import { protect, adminOnly, AuthRequest } from "../middleware/auth";

const router = Router();

router.post("/register", protect, adminOnly, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { username, password, role } = req.body as { username: string; password: string; role?: string };
    if (!username || !password) {
      res.status(400).json({ message: "Username and password are required" });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ message: "Password must be at least 6 characters" });
      return;
    }
    const existing = await User.findOne({ username });
    if (existing) {
      res.status(409).json({ message: "Username already exists" });
      return;
    }
    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({ username, password: hashed, role: role ?? "admin" });
    res.status(201).json({ message: "User created successfully", id: user._id, username: user.username, role: user.role });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/users", protect, adminOnly, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await User.find({}, { password: 0 }).sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/users/:id", protect, adminOnly, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (req.user?.id === id) {
      res.status(400).json({ message: "Cannot delete your own account" });
      return;
    }
    await User.findByIdAndDelete(id);
    res.json({ message: "User deleted" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/login", async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body as { username: string; password: string };
    if (!username || !password) {
      res.status(400).json({ message: "Username and password are required" });
      return;
    }
    const user = await User.findOne({ username });
    if (!user) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }
    const secret = process.env["JWT_SECRET"]!;
    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      secret,
      { expiresIn: "7d" }
    );
    res.json({ token, role: user.role, username: user.username });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/me", protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?.id, { password: 0 });
    if (!user) { res.status(404).json({ message: "User not found" }); return; }
    res.json(user);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
