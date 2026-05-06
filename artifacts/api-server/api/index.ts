import { connectDB } from "../src/config/db";
import app from "../src/app";

let dbReady = false;

export default async function handler(req: any, res: any) {
  if (!dbReady) {
    try {
      await connectDB();
      dbReady = true;
    } catch (err) {
      console.error("MongoDB connection error:", err);
    }
  }
  return app(req, res);
}
