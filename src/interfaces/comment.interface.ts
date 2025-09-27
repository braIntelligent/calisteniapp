import { Document, Types } from "mongoose";

export interface IComment extends Document {
  text: string;
  author: Types.ObjectId; // User
  bar: Types.ObjectId; // Bar
  date: Date;
  active: boolean;
}
