import { Router, Response } from "express";
import News from "../models/News";
import { protect, adminOnly, AuthRequest } from "../middleware/auth";

const router = Router();

router.get("/", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { category, search, page = "1", limit = "20" } = req.query as Record<string, string>;
    const filter: Record<string, unknown> = {};
    if (category && category !== "all") filter["category"] = category;
    if (search) filter["$or"] = [
      { title: { $regex: search, $options: "i" } },
      { content: { $regex: search, $options: "i" } },
    ];
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [news, total] = await Promise.all([
      News.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      News.countDocuments(filter),
    ]);
    res.json({ news, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/categories", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const categories = await News.distinct("category");
    res.json(categories);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/:id", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const item = await News.findById(req.params["id"]);
    if (!item) { res.status(404).json({ message: "Not found" }); return; }
    res.json(item);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/", protect, adminOnly, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, content, image, video, category } = req.body as {
      title: string; content: string; image?: string; video?: string; category: string;
    };
    if (!title || !content || !category) {
      res.status(400).json({ message: "Title, content, and category are required" });
      return;
    }
    const item = await News.create({ title, content, image: image ?? "", video: video ?? "", category });
    res.status(201).json(item);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/:id", protect, adminOnly, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const item = await News.findByIdAndUpdate(req.params["id"], req.body, { new: true, runValidators: true });
    if (!item) { res.status(404).json({ message: "Not found" }); return; }
    res.json(item);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/:id", protect, adminOnly, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const item = await News.findByIdAndDelete(req.params["id"]);
    if (!item) { res.status(404).json({ message: "Not found" }); return; }
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
