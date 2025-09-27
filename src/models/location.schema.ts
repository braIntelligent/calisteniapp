import { Schema, model } from "mongoose";
import { ILocation } from "@/interfaces/location.interface";

const LocationSchema = new Schema<ILocation>(
  {
    coordinatex: { type: String, required: true },
    coordinatey: { type: String, required: true },
    bar: { type: Schema.Types.ObjectId, ref: "Bar", required: true },
    active: { type: Boolean, default: true },
  },
  { versionKey: false }
);

export const Location = model<ILocation>("Location", LocationSchema);
