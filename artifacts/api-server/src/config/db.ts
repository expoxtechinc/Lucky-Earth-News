import mongoose from "mongoose";
import { logger } from "../lib/logger";

let cached: typeof mongoose | null = null;

export async function connectDB(): Promise<void> {
  if (cached && mongoose.connection.readyState === 1) {
    return;
  }
  const uri = process.env["MONGO_URI"];
  if (!uri) {
    throw new Error("MONGO_URI environment variable is required");
  }
  cached = await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 15000,
    socketTimeoutMS: 45000,
    maxPoolSize: 10,
    bufferCommands: false,
  });
  logger.info("MongoDB connected");
}
