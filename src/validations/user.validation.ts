import { NextFunction, Request, Response } from "express";
import { z } from "zod";

// Schema con Zod
export const createUserSchemaZod = z
  .object({
    username: z
      .string()
      .min(3, "Username must be at least 3 characters long")
      .max(30, "Username cannot exceed 30 characters")
      .regex(
        /^[a-zA-Z0-9]+$/,
        "Username must contain only letters and numbers"
      ),

    email: z
      .string()
      .email("Please provide a valid email address")
      .max(255, "Email cannot exceed 255 characters"),

    password: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .max(128, "Password cannot exceed 128 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
      ),

    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// Tipo inferido del schema
export type CreateUserInput = z.infer<typeof createUserSchemaZod>;

// Middleware de validación con Zod
export const validateCreateUserZod = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedData = createUserSchemaZod.parse(req.body);
    req.body = validatedData;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      return res.status(400).json({
        error: "Validation failed",
        details: errors,
      });
    }
    next(error);
  }
};
