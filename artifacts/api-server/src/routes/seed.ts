import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import User from "../models/User";
import News from "../models/News";

const router = Router();

router.post("/seed", async (req: Request, res: Response): Promise<void> => {
  try {
    const existingAdmin = await User.findOne({ username: "admin" });
    if (!existingAdmin) {
      const hashed = await bcrypt.hash("admin123", 12);
      await User.create({ username: "admin", password: hashed, role: "admin" });
    }

    const count = await News.countDocuments();
    if (count === 0) {
      await News.insertMany([
        {
          title: "Lucky Earth News Launches New Platform",
          content: "Lucky Earth News is proud to announce the launch of its brand-new digital news platform, bringing real-time global stories to readers everywhere. Our mission is to deliver credible, fast, and mobile-first journalism to every corner of the world.",
          image: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800",
          video: "",
          category: "Technology",
        },
        {
          title: "Global Climate Summit Reaches Historic Agreement",
          content: "World leaders gathered in Geneva have signed a landmark climate agreement pledging to reduce carbon emissions by 50% before 2035. The deal, brokered after weeks of intense negotiations, is being hailed as the most significant environmental breakthrough in decades.",
          image: "https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=800",
          video: "",
          category: "World",
        },
        {
          title: "Tech Giants Invest Billions in AI Infrastructure",
          content: "Major technology companies are pouring record investments into artificial intelligence infrastructure as demand for AI-powered services surges globally. Analysts project the AI sector will reshape industries from healthcare to finance over the next five years.",
          image: "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800",
          video: "",
          category: "Technology",
        },
        {
          title: "Champions League Final Breaks Viewership Records",
          content: "This year's UEFA Champions League final drew over 500 million viewers worldwide, setting a new broadcast record. The thrilling match went to extra time before a stunning late goal sealed one of the most dramatic finals in tournament history.",
          image: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800",
          video: "",
          category: "Sports",
        },
        {
          title: "New Study Links Mediterranean Diet to Longer Life",
          content: "A comprehensive 20-year study published in the New England Journal of Medicine confirms that following a Mediterranean diet significantly reduces the risk of heart disease, diabetes, and cognitive decline, adding an average of 4.5 years to participants' lifespans.",
          image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800",
          video: "",
          category: "Health",
        },
        {
          title: "Stock Markets Surge on Strong Economic Data",
          content: "Global stock markets rallied sharply after better-than-expected economic data from the US, EU, and Asia signaled a robust recovery. The S&P 500 gained 2.3% while the FTSE 100 reached its highest level in three years.",
          image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800",
          video: "",
          category: "Business",
        },
      ]);
    }

    res.json({ message: "Database seeded successfully. Admin credentials: username=admin, password=admin123" });
  } catch (err) {
    res.status(500).json({ message: "Seed failed", error: String(err) });
  }
});

export default router;
