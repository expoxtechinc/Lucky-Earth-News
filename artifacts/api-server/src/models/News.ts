import mongoose, { Schema, Document } from "mongoose";

export interface INews extends Document {
  title: string;
  content: string;
  image: string;
  video: string;
  category: string;
  createdAt: Date;
}

const NewsSchema: Schema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    image: { type: String, default: "" },
    video: { type: String, default: "" },
    category: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

export default mongoose.model<INews>("News", NewsSchema);
