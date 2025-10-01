// src/validations/schemas/comment.schemazod.ts
import { z } from "zod";
import { Types } from "mongoose";

// Schema para crear comentario
export const createCommentSchemaZod = z.object({
  text: z
    .string()
    .min(1, "Comment cannot be empty")
    .max(1000, "Comment cannot exceed 1000 characters")
    .trim()
    .refine((text) => text.length > 0, {
      message: "Comment cannot be only whitespace"
    }),

  barId: z
    .string()
    .refine((id) => Types.ObjectId.isValid(id), {
      message: "Invalid bar ID format"
    }),

  parentCommentId: z
    .string()
    .refine((id) => Types.ObjectId.isValid(id), {
      message: "Invalid parent comment ID format"
    })
    .optional()
});

// Schema para actualizar comentario
export const updateCommentSchemaZod = z.object({
  text: z
    .string()
    .min(1, "Comment cannot be empty")
    .max(1000, "Comment cannot exceed 1000 characters")
    .trim()
    .refine((text) => text.length > 0, {
      message: "Comment cannot be only whitespace"
    })
});

// Schema para parámetros de paginación
export const commentPaginationSchemaZod = z.object({
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

// Schema para validar IDs en parámetros
export const commentIdSchemaZod = z.object({
  id: z
    .string()
    .refine((id) => Types.ObjectId.isValid(id), {
      message: "Invalid comment ID format"
    })
});

export const barIdSchemaZod = z.object({
  barId: z
    .string()
    .refine((id) => Types.ObjectId.isValid(id), {
      message: "Invalid bar ID format"
    })
});

export const userIdSchemaZod = z.object({
  userId: z
    .string()
    .refine((id) => Types.ObjectId.isValid(id), {
      message: "Invalid user ID format"
    })
});

// Tipos TypeScript
export type CreateCommentInput = z.infer<typeof createCommentSchemaZod>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchemaZod>;
export type CommentPaginationInput = z.infer<typeof commentPaginationSchemaZod>;
export type CommentIdInput = z.infer<typeof commentIdSchemaZod>;
export type BarIdInput = z.infer<typeof barIdSchemaZod>;
export type UserIdInput = z.infer<typeof userIdSchemaZod>;