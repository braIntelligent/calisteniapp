import { Schema, model } from "mongoose";
import { IPunctuation } from "@/interfaces/punctuation.interface";

const PunctuationSchema = new Schema<IPunctuation>(
  {
    value: { type: Number, min: 1, max: 5, default: 1 },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    bar: { type: Schema.Types.ObjectId, ref: "Bar", required: true },
    date: { type: Date, default: Date.now },
    active: { type: Boolean, default: true },
  },
  { versionKey: false }
);

export const Punctuation = model<IPunctuation>(
  "Punctuation",
  PunctuationSchema
);
