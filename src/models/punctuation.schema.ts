// src/models/punctuation.schema.ts - ACTUALIZADO
import { Schema, model } from "mongoose";
import { IPunctuation } from "@/interfaces/punctuation.interface";

const PunctuationSchema = new Schema<IPunctuation>(
  {
    value: { 
      type: Number, 
      min: 1, 
      max: 5, 
      required: true 
    },
    user: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    bar: { 
      type: Schema.Types.ObjectId, 
      ref: "Bar", 
      required: true 
    },
    review: {
      type: String,
      maxlength: 500,
      trim: true
    },
    criteria: {
      equipment: { 
        type: Number, 
        min: 1, 
        max: 5,
        required: true
      },
      location: { 
        type: Number, 
        min: 1, 
        max: 5,
        required: true
      },
      maintenance: { 
        type: Number, 
        min: 1, 
        max: 5,
        required: true
      },
      safety: { 
        type: Number, 
        min: 1, 
        max: 5,
        required: true
      }
    },
    date: { 
      type: Date, 
      default: Date.now 
    },
    active: { 
      type: Boolean, 
      default: true 
    }
  },
  { 
    versionKey: false,
    // Índices para consultas eficientes
    indexes: [
      { user: 1, bar: 1 }, // Índice compuesto para buscar rating de usuario específico
      { bar: 1, date: -1 }, // Para obtener ratings de una barra ordenados por fecha
      { user: 1, date: -1 }, // Para obtener ratings de un usuario
      { value: 1 } // Para estadísticas por valor
    ]
  }
);

// Prevenir ratings duplicados del mismo usuario para la misma barra
PunctuationSchema.index({ user: 1, bar: 1 }, { 
  unique: true,
  partialFilterExpression: { active: true }
});

// Método virtual para calcular rating promedio de criterios
PunctuationSchema.virtual('criteriaAverage').get(function() {
  if (!this.criteria) return this.value;
  
  const { equipment, location, maintenance, safety } = this.criteria;
  return Math.round(((equipment + location + maintenance + safety) / 4) * 10) / 10;
});

// Método virtual para verificar si tiene reseña
PunctuationSchema.virtual('hasReview').get(function() {
  return !!(this.review && this.review.trim().length > 0);
});

// Asegurar que virtuals se incluyan en JSON
PunctuationSchema.set('toJSON', { virtuals: true });

export const Punctuation = model<IPunctuation>("Punctuation", PunctuationSchema);