import { Document, Types } from "mongoose";

export interface IComment extends Document {
  text: string;
  author: Types.ObjectId; // Usuario que comentó
  barId: Types.ObjectId; // Barra comentada
  parentComment?: Types.ObjectId; // Para respuestas a comentarios
  likes: Types.ObjectId[]; // Usuarios que dieron like
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}