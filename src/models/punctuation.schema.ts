import { Schema, model } from "mongoose";
import { IRating } from "@/interfaces/punctuation.interface";

const PunctuationSchema = new Schema<IRating>(
  {
    value: { type: Number, min: 1, max: 5, default: 1 },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    barId: { type: Schema.Types.ObjectId, ref: "Bar", required: true },
    createdAt: { type: Date, default: Date.now },
    active: { type: Boolean, default: true },
  },
  { versionKey: false }
);

export const Punctuation = model<IRating>("Punctuation", PunctuationSchema);
