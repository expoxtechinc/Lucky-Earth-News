import mongoose from "mongoose";
import { logger } from "../lib/logger";

export async function connectDB(): Promise<void> {
  const uri = process.env["MONGO_URI"];
  if (!uri) {
    throw new Error("MONGO_URI environment variable is required");
  }
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 15000,
    socketTimeoutMS: 45000,
  });
  logger.info("MongoDB connected");
}
