// src/validations/schemas/bar.schemazod.ts
import { z } from "zod";

// Schema para crear barra
export const createBarSchemaZod = z.object({
  name: z
    .string()
    .min(3, "Name must be at least 3 characters long")
    .max(100, "Name cannot exceed 100 characters")
    .trim(),

  description: z
    .string()
    .min(10, "Description must be at least 10 characters long")
    .max(500, "Description cannot exceed 500 characters")
    .trim(),

  location: z.object({
    coordinates: z.object({
      latitude: z
        .number()
        .min(-90, "Latitude must be between -90 and 90")
        .max(90, "Latitude must be between -90 and 90"),
      longitude: z
        .number()
        .min(-180, "Longitude must be between -180 and 180")
        .max(180, "Longitude must be between -180 and 180")
    }),
    address: z
      .string()
      .max(200, "Address cannot exceed 200 characters")
      .trim()
      .optional()
  }),

  equipment: z.object({
    pullUpBar: z.boolean().default(false),
    parallelBars: z.boolean().default(false),
    wallBars: z.boolean().default(false),
    rings: z.boolean().default(false),
    other: z
      .string()
      .max(200, "Equipment description cannot exceed 200 characters")
      .trim()
      .optional()
  }).optional(),

  features: z.object({
    parking: z.boolean().default(false),
    lighting: z.boolean().default(false),
    accessibility: z.boolean().default(false),
    covered: z.boolean().default(false)
  }).optional(),

  images: z
    .array(
      z
        .string()
        .url("Each image must be a valid URL")
        .regex(/\.(jpg|jpeg|png|webp|gif)$/i, "Images must be in jpg, png, webp or gif format")
    )
    .max(5, "Maximum 5 images allowed")
    .optional()
}).refine(
  (data) => {
    // Al menos un tipo de equipamiento debe estar disponible
    const equipment = data.equipment || {};
    return (
      equipment.pullUpBar ||
      equipment.parallelBars ||
      equipment.wallBars ||
      equipment.rings ||
      (equipment.other && equipment.other.length > 0)
    );
  },
  {
    message: "At least one type of equipment must be available",
    path: ["equipment"]
  }
);

// Schema para actualizar barra
export const updateBarSchemaZod = z.object({
  name: z
    .string()
    .min(3, "Name must be at least 3 characters long")
    .max(100, "Name cannot exceed 100 characters")
    .trim()
    .optional(),

  description: z
    .string()
    .min(10, "Description must be at least 10 characters long")
    .max(500, "Description cannot exceed 500 characters")
    .trim()
    .optional(),

  location: z.object({
    coordinates: z.object({
      latitude: z
        .number()
        .min(-90, "Latitude must be between -90 and 90")
        .max(90, "Latitude must be between -90 and 90"),
      longitude: z
        .number()
        .min(-180, "Longitude must be between -180 and 180")
        .max(180, "Longitude must be between -180 and 180")
    }),
    address: z
      .string()
      .max(200, "Address cannot exceed 200 characters")
      .trim()
      .optional()
  }).optional(),

  equipment: z.object({
    pullUpBar: z.boolean().optional(),
    parallelBars: z.boolean().optional(),
    wallBars: z.boolean().optional(),
    rings: z.boolean().optional(),
    other: z
      .string()
      .max(200, "Equipment description cannot exceed 200 characters")
      .trim()
      .optional()
  }).optional(),

  features: z.object({
    parking: z.boolean().optional(),
    lighting: z.boolean().optional(),
    accessibility: z.boolean().optional(),
    covered: z.boolean().optional()
  }).optional(),

  images: z
    .array(
      z
        .string()
        .url("Each image must be a valid URL")
        .regex(/\.(jpg|jpeg|png|webp|gif)$/i, "Images must be in jpg, png, webp or gif format")
    )
    .max(5, "Maximum 5 images allowed")
    .optional()
});

// Schema para búsqueda por ubicación
export const searchLocationSchemaZod = z.object({
  latitude: z
    .string()
    .transform((val) => parseFloat(val))
    .refine((val) => !isNaN(val) && val >= -90 && val <= 90, {
      message: "Latitude must be a valid number between -90 and 90"
    }),
  longitude: z
    .string()
    .transform((val) => parseFloat(val))
    .refine((val) => !isNaN(val) && val >= -180 && val <= 180, {
      message: "Longitude must be a valid number between -180 and 180"
    }),
  radius: z
    .string()
    .transform((val) => parseFloat(val))
    .refine((val) => !isNaN(val) && val > 0 && val <= 50, {
      message: "Radius must be a positive number up to 50 km"
    })
    .default("5")
});

// Schema para filtros de búsqueda
export const barFiltersSchemaZod = z.object({
  equipment: z
    .string()
    .refine((val) => {
      const validTypes = ['pullUpBar', 'parallelBars', 'wallBars', 'rings'];
      const types = val.split(',');
      return types.every(type => validTypes.includes(type.trim()));
    }, {
      message: "Invalid equipment types"
    })
    .optional(),
  features: z
    .string()
    .refine((val) => {
      const validFeatures = ['parking', 'lighting', 'accessibility', 'covered'];
      const features = val.split(',');
      return features.every(feature => validFeatures.includes(feature.trim()));
    }, {
      message: "Invalid feature types"
    })
    .optional(),
  minRating: z
    .string()
    .transform((val) => parseFloat(val))
    .refine((val) => !isNaN(val) && val >= 1 && val <= 5, {
      message: "Minimum rating must be between 1 and 5"
    })
    .optional(),
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

// Tipos TypeScript
export type CreateBarInput = z.infer<typeof createBarSchemaZod>;
export type UpdateBarInput = z.infer<typeof updateBarSchemaZod>;
export type SearchLocationInput = z.infer<typeof searchLocationSchemaZod>;
export type BarFiltersInput = z.infer<typeof barFiltersSchemaZod>;