// src/validations/schemas/rating.schemazod.ts
import { z } from "zod";
import { Types } from "mongoose";

// Schema para crear/actualizar rating
export const createRatingSchemaZod = z.object({
  value: z
    .number()
    .int("Rating must be an integer")
    .min(1, "Rating must be at least 1")
    .max(5, "Rating cannot exceed 5"),

  barId: z
    .string()
    .refine((id) => Types.ObjectId.isValid(id), {
      message: "Invalid bar ID format"
    }),

  review: z
    .string()
    .max(500, "Review cannot exceed 500 characters")
    .trim()
    .optional(),

  criteria: z.object({
    equipment: z
      .number()
      .int("Equipment rating must be an integer")
      .min(1, "Equipment rating must be at least 1")
      .max(5, "Equipment rating cannot exceed 5"),
    
    location: z
      .number()
      .int("Location rating must be an integer")
      .min(1, "Location rating must be at least 1")
      .max(5, "Location rating cannot exceed 5"),
    
    maintenance: z
      .number()
      .int("Maintenance rating must be an integer")
      .min(1, "Maintenance rating must be at least 1")
      .max(5, "Maintenance rating cannot exceed 5"),
    
    safety: z
      .number()
      .int("Safety rating must be an integer")
      .min(1, "Safety rating must be at least 1")
      .max(5, "Safety rating cannot exceed 5")
  }).optional()
}).refine((data) => {
  // Si no se proporcionan criterios específicos, usar el valor general
  if (!data.criteria) {
    data.criteria = {
      equipment: data.value,
      location: data.value,
      maintenance: data.value,
      safety: data.value
    };
  }
  return true;
});

// Schema para actualizar rating existente
export const updateRatingSchemaZod = z.object({
  value: z
    .number()
    .int("Rating must be an integer")
    .min(1, "Rating must be at least 1")
    .max(5, "Rating cannot exceed 5"),

  review: z
    .string()
    .max(500, "Review cannot exceed 500 characters")
    .trim()
    .optional(),

  criteria: z.object({
    equipment: z
      .number()
      .int("Equipment rating must be an integer")
      .min(1, "Equipment rating must be at least 1")
      .max(5, "Equipment rating cannot exceed 5"),
    
    location: z
      .number()
      .int("Location rating must be an integer")
      .min(1, "Location rating must be at least 1")
      .max(5, "Location rating cannot exceed 5"),
    
    maintenance: z
      .number()
      .int("Maintenance rating must be an integer")
      .min(1, "Maintenance rating must be at least 1")
      .max(5, "Maintenance rating cannot exceed 5"),
    
    safety: z
      .number()
      .int("Safety rating must be an integer")
      .min(1, "Safety rating must be at least 1")
      .max(5, "Safety rating cannot exceed 5")
  }).optional()
});

// Schema para parámetros de paginación
export const ratingPaginationSchemaZod = z.object({
  page: z
    .string()
    .transform((val) => parseInt(val))
    .refine((val) => !isNaN(val) && val >= 1, {
      message: "Page must be a positive number"
    })
    .default("1"),
    
  limit: z
    .string()
    .transform((val) => parseInt(val))
    .refine((val) => !isNaN(val) && val >= 1 && val <= 50, {
      message: "Limit must be between 1 and 50"
    })
    .default("10")
});

// Schema para filtros de ratings
export const ratingFiltersSchemaZod = z.object({
  minRating: z
    .string()
    .transform((val) => parseInt(val))
    .refine((val) => !isNaN(val) && val >= 1 && val <= 5, {
      message: "Minimum rating must be between 1 and 5"
    })
    .optional(),
    
  maxRating: z
    .string()
    .transform((val) => parseInt(val))
    .refine((val) => !isNaN(val) && val >= 1 && val <= 5, {
      message: "Maximum rating must be between 1 and 5"
    })
    .optional(),
    
  hasReview: z
    .string()
    .transform((val) => val.toLowerCase() === 'true')
    .optional(),
    
  sortBy: z
    .enum(['date', 'rating', 'helpful'])
    .default('date'),
    
  order: z
    .enum(['asc', 'desc'])
    .default('desc')
}).refine((data) => {
  // Validar que minRating <= maxRating si ambos están presentes
  if (data.minRating && data.maxRating && data.minRating > data.maxRating) {
    return false;
  }
  return true;
}, {
  message: "Minimum rating must be less than or equal to maximum rating"
});

// Schema para validar IDs en parámetros
export const ratingIdSchemaZod = z.object({
  id: z
    .string()
    .refine((id) => Types.ObjectId.isValid(id), {
      message: "Invalid rating ID format"
    })
});

export const barIdSchemaZod = z.object({
  barId: z
    .string()
    .refine((id) => Types.ObjectId.isValid(id), {
      message: "Invalid bar ID format"
    })
});

export const userBarIdsSchemaZod = z.object({
  barId: z
    .string()
    .refine((id) => Types.ObjectId.isValid(id), {
      message: "Invalid bar ID format"
    }),
  userId: z
    .string()
    .refine((id) => Types.ObjectId.isValid(id), {
      message: "Invalid user ID format"
    })
});

// Tipos TypeScript
export type CreateRatingInput = z.infer<typeof createRatingSchemaZod>;
export type UpdateRatingInput = z.infer<typeof updateRatingSchemaZod>;
export type RatingPaginationInput = z.infer<typeof ratingPaginationSchemaZod>;
export type RatingFiltersInput = z.infer<typeof ratingFiltersSchemaZod>;
export type RatingIdInput = z.infer<typeof ratingIdSchemaZod>;
export type BarIdInput = z.infer<typeof barIdSchemaZod>;
export type UserBarIdsInput = z.infer<typeof userBarIdsSchemaZod>;