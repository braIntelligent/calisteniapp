import { z } from "zod";

// Schema para creación de usuario
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
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,128}$/,
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
      ),

    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// Schema para actualizar usuario (campos opcionales)
export const updateUserSchemaZod = z
  .object({
    newUsername: z
      .string()
      .min(3, "Username must be at least 3 characters long")
      .max(30, "Username cannot exceed 30 characters")
      .regex(/^[a-zA-Z0-9]+$/, "Username must contain only letters and numbers")
      .optional(),

    newEmail: z
      .string()
      .email("Please provide a valid email address")
      .max(255, "Email cannot exceed 255 characters")
      .optional(),

    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .max(128, "Password cannot exceed 128 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,128}$/,
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
      )
      .optional(),

    confirmPassword: z.string().optional(),

    currentPassword: z.string().nonempty("Current password is required"),
  })
  .refine(
    (data) => !data.newPassword || data.newPassword === data.confirmPassword,
    {
      message: "New password and confirm password do not match",
      path: ["confirmPassword"],
    }
  );

export type CreateUserInput = z.infer<typeof createUserSchemaZod>;
export type UpdateUserInput = z.infer<typeof updateUserSchemaZod>;

// Agregar al final de src/validations/schemas/user.schemazod.ts

// Schema para login
export const loginSchemaZod = z.object({
  emailOrUsername: z
    .string()
    .min(3, "Email or username must be at least 3 characters long")
    .max(255, "Email or username cannot exceed 255 characters"),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(128, "Password cannot exceed 128 characters"),
});

// Schema para crear admin (igual que createUser pero sin confirmPassword)
export const createAdminSchemaZod = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters long")
    .max(30, "Username cannot exceed 30 characters")
    .regex(/^[a-zA-Z0-9]+$/, "Username must contain only letters and numbers"),

  email: z
    .string()
    .email("Please provide a valid email address")
    .max(255, "Email cannot exceed 255 characters"),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(128, "Password cannot exceed 128 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,128}$/,
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    ),
});

// Tipos TypeScript
export type LoginInput = z.infer<typeof loginSchemaZod>;
export type CreateAdminInput = z.infer<typeof createAdminSchemaZod>;
