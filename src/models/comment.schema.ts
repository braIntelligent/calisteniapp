// src/models/comment.schema.ts - ACTUALIZADO
import { Schema, model } from "mongoose";
import { IComment } from "@/interfaces/comment.interface";

const CommentSchema = new Schema<IComment>(
  {
    text: { 
      type: String, 
      required: true,
      minlength: 1,
      maxlength: 1000,
      trim: true
    },
    author: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    barId: { 
      type: Schema.Types.ObjectId, 
      ref: "Bar", 
      required: true 
    },
    parentComment: { 
      type: Schema.Types.ObjectId, 
      ref: "Comment",
      default: null
    },
    likes: [{
      type: Schema.Types.ObjectId,
      ref: "User"
    }],
    active: { 
      type: Boolean, 
      default: true 
    },
    isEdited: {
      type: Boolean,
      default: false
    },
    createdAt: { 
      type: Date, 
      default: Date.now 
    },
    updatedAt: { 
      type: Date, 
      default: Date.now 
    }
  },
  { 
    versionKey: false,
    // Índices para consultas eficientes
    indexes: [
      { barId: 1, parentComment: 1 },
      { author: 1 },
      { createdAt: -1 }
    ]
  }
);

// Middleware para actualizar updatedAt automáticamente
CommentSchema.pre('findOneAndUpdate', function() {
  this.set({ updatedAt: new Date() });
});

// Método virtual para contar likes
CommentSchema.virtual('likesCount').get(function() {
  return this.likes ? this.likes.length : 0;
});

// Método virtual para verificar si es respuesta
CommentSchema.virtual('isReply').get(function() {
  return this.parentComment != null;
});

// Asegurar que virtuals se incluyan en JSON
CommentSchema.set('toJSON', { virtuals: true });

export const Comment = model<IComment>("Comment", CommentSchema);