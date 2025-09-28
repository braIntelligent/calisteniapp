import { Document, Types } from "mongoose";

export interface ILocation extends Document {
  coordinates: {
    latitude: number;
    longitude: number;
  };
  address?: string;
  barId: Types.ObjectId;
  active: boolean;
}
