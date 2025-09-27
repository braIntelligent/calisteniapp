import { Schema, model } from "mongoose";
import { IBar } from "@/interfaces/bar.interface";

const BarSchema = new Schema<IBar>(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    creator: { type: Schema.Types.ObjectId, ref: "User", required: true },
    location: { type: Schema.Types.ObjectId, ref: "Location", required: true },
    comments: [{ type: Schema.Types.ObjectId, ref: "Comment" }],
    punctuation: [{ type: Schema.Types.ObjectId, ref: "Punctuation" }],
    parking: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
    date: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

export const Bar = model<IBar>("Bar", BarSchema);
