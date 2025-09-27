import { Schema, model } from "mongoose";
import { IComment } from "@/interfaces/comment.interface";

const CommentSchema = new Schema<IComment>(
  {
    text: { type: String, required: true },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    bar: { type: Schema.Types.ObjectId, ref: "Bar", required: true },
    date: { type: Date, default: Date.now },
    active: { type: Boolean, default: true },
  },
  { versionKey: false }
);

export const Comment = model<IComment>("Comment", CommentSchema);
