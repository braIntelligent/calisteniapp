import { IUser } from "@/interfaces/user.interface";
import mongoose, { Schema, model } from "mongoose";

const userSchema: Schema = new mongoose.Schema<IUser>(
  {
    username: { type: String, require: true },
    email: { type: String, unique: true, require: true },
    password: { type: String, require: true },
    active: {type: Boolean, default: false},
    registerDate: { type: Date, require: true },
  },
  { versionKey: false }
);

export const User = model("User", userSchema);
