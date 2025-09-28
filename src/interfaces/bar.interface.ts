// src/interfaces/bar.interface.ts - ACTUALIZADA
import { Document, Types } from "mongoose";

export interface IBar extends Document {
  name: string;
  description: string;
  creator: Types.ObjectId;

  location: {
    coordinates: {
      latitude: number;
      longitude: number;
    };
    address?: string;
  };

  equipment: {
    pullUpBar: boolean; // Barra para dominadas
    parallelBars: boolean; // Barras paralelas
    wallBars: boolean; // Espalderas
    rings: boolean; // Anillas
    other?: string; // Otro equipamiento
  };

  features: {
    parking: boolean; // Estacionamiento disponible
    lighting: boolean; // Iluminación nocturna
    accessibility: boolean; // Accesible para discapacitados
    covered: boolean; // Techado/cubierto
  };

  images: string[]; // URLs de imágenes
  comments: Types.ObjectId[]; // Referencias a comentarios
  punctuation: Types.ObjectId[]; // Referencias a puntuaciones
  averageRating: number; // Rating promedio (0-5)
  totalRatings: number; // Número total de ratings
  active: boolean;
  createdAt: Date;
  updatedAt: Date;

  // Métodos
  calculateAverageRating(): Promise<void>;
}
