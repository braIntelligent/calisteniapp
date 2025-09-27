import { Document, Types } from "mongoose";

export interface IPunctuation extends Document {
  value: number;
  user: Types.ObjectId; // User
  bar: Types.ObjectId;  // Bar
  date: Date;
  active: boolean;
}
