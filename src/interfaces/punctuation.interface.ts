// src/interfaces/punctuation.interface.ts - ACTUALIZADA
import { Document, Types } from "mongoose";

export interface IPunctuation extends Document {
  value: number; // Rating general (1-5)
  user: Types.ObjectId;
  bar: Types.ObjectId;
  review?: string; // Reseña opcional
  criteria: {
    equipment: number;   // Calidad del equipamiento (1-5)
    location: number;    // Ubicación/accesibilidad (1-5)  
    maintenance: number; // Mantenimiento (1-5)
    safety: number;      // Seguridad del área (1-5)
  };
  date: Date;
  active: boolean;
  
  // Virtuales
  criteriaAverage: number;
  hasReview: boolean;
}