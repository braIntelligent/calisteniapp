import { Schema, model } from "mongoose";
import { IUser } from "@/interfaces/user.interface";

const UserSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    active: { type: Boolean, default: true },
    registerDate: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

export const User = model<IUser>("User", UserSchema);
