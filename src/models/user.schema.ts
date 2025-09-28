import { Schema, model } from "mongoose";
import { IUser } from "@/interfaces/user.interface";

const UserSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    email: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
      trim: true,
      maxlength: 255,
    },
    password: { type: String, required: true, minlength: 8 },
    role: { type: String, enum: ["admin", "user"], default: "user" },
    active: { type: Boolean, default: true },
    registerDate: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

export const User = model<IUser>("User", UserSchema);
