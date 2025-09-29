import { Document, Types } from "mongoose";

export interface IRating extends Document {
  value: number; // 1-5 estrellas
  userId: Types.ObjectId; // Usuario que calificó
  barId: Types.ObjectId; // Barra calificada
  review?: string; // Reseña opcional
  criteria: {
    equipment: number; // Calidad del equipamiento (1-5)
    location: number; // Ubicación/accesibilidad (1-5)  
    maintenance: number; // Mantenimiento (1-5)
    safety: number; // Seguridad del área (1-5)
  };
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}