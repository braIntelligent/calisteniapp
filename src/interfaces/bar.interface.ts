import { Document, Types } from "mongoose";

export interface IBar extends Document {
  name: string;
  description: string;
  creator: Types.ObjectId; // User
  location: Types.ObjectId; // Location
  comments: Types.ObjectId[]; // Lista de comentarios
  punctuation: Types.ObjectId[]; // Lista de puntuaciones
  parking: boolean;
  active: boolean;
  date: Date;
}
