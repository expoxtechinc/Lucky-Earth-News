import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  username: string;
  password: string;
  role: "admin" | "user";
}

const UserSchema: Schema = new Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["admin", "user"], default: "user" },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>("User", UserSchema);
