import { Document, Types } from "mongoose";

export interface ILocation extends Document {
  coordinatex: string;
  coordinatey: string;
  bar: Types.ObjectId;
  active: boolean;
}
