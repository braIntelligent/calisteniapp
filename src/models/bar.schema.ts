// src/models/bar.schema.ts - ACTUALIZADO
import { Schema, model } from "mongoose";
import { IBar } from "@/interfaces/bar.interface";

const BarSchema = new Schema<IBar>(
  {
    name: {
      type: String,
      required: true,
      minlength: 3,
      maxlength: 100,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      minlength: 10,
      maxlength: 500,
      trim: true,
    },
    creator: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Ubicación GPS
    location: {
      coordinates: {
        latitude: {
          type: Number,
          required: true,
          min: -90,
          max: 90,
        },
        longitude: {
          type: Number,
          required: true,
          min: -180,
          max: 180,
        },
      },
      address: {
        type: String,
        maxlength: 200,
        trim: true,
      },
    },

    // Equipamiento disponible
    equipment: {
      pullUpBar: { type: Boolean, default: false }, // Barra dominadas
      parallelBars: { type: Boolean, default: false }, // Barras paralelas
      wallBars: { type: Boolean, default: false }, // Espalderas
      rings: { type: Boolean, default: false }, // Anillas
      other: {
        type: String,
        maxlength: 200,
        trim: true,
      },
    },

    // Características del lugar
    features: {
      parking: { type: Boolean, default: false }, // Estacionamiento
      lighting: { type: Boolean, default: false }, // Iluminación nocturna
      accessibility: { type: Boolean, default: false }, // Accesible
      covered: { type: Boolean, default: false }, // Techado
    },

    // Imágenes
    images: [
      {
        type: String,
        validate: {
          validator: function (v: string) {
            // Validar que sea una URL válida
            return /^https?:\/\/.+/.test(v);
          },
          message: "Images must be valid URLs",
        },
      },
    ],

    // Sistema de comentarios y puntuaciones
    comments: [
      {
        type: Schema.Types.ObjectId,
        ref: "Comment",
      },
    ],
    punctuation: [
      {
        type: Schema.Types.ObjectId,
        ref: "Punctuation",
      },
    ],

    // Estadísticas de rating
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalRatings: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Campos de control
    active: {
      type: Boolean,
      default: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    versionKey: false,
    // Índices para búsquedas geográficas eficientes
    indexes: [
      {
        "location.coordinates.latitude": 1,
        "location.coordinates.longitude": 1,
      },
      { creator: 1 },
      { averageRating: -1 },
      { createdAt: -1 },
    ],
  }
);

// Middleware para actualizar updatedAt automáticamente
BarSchema.pre("findOneAndUpdate", function () {
  this.set({ updatedAt: new Date() });
});

// Método para calcular rating promedio
BarSchema.methods.calculateAverageRating = async function () {
  const Punctuation = model("Punctuation");
  const ratings = await Punctuation.find({
    bar: this._id,
    active: true,
  });

  if (ratings.length === 0) {
    this.averageRating = 0;
    this.totalRatings = 0;
  } else {
    const sum = ratings.reduce(
      (acc: number, rating: any) => acc + rating.value,
      0
    );
    this.averageRating = Math.round((sum / ratings.length) * 10) / 10; // 1 decimal
    this.totalRatings = ratings.length;
  }

  await this.save();
};

export const Bar = model<IBar>("Bar", BarSchema);
