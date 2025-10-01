// src/interfaces/comment.interface.ts - ACTUALIZADA
import { Document, Types } from "mongoose";

export interface IComment extends Document {
  text: string;
  author: Types.ObjectId;
  barId: Types.ObjectId;
  parentComment?: Types.ObjectId | null; // Para respuestas a comentarios
  likes: Types.ObjectId[]; // Usuarios que dieron like
  active: boolean;
  isEdited: boolean; // Si el comentario fue editado
  createdAt: Date;
  updatedAt: Date;
  
  // Virtuales
  likesCount: number;
  isReply: boolean;
}