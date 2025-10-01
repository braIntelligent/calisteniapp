import { Request, Response } from "express";
import { User } from "@/models/user.schema";
import {
  normalize,
  hashPassword,
  isEmailBlocked,
  isUsernameOrEmailTaken,
  comparePassword,
} from "@/utils/user.helpers";
import jwt from "jsonwebtoken";

const generateToken = (user: any) => {
  const JWT_SECRET = process.env.JWT_SECRET;
  const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d";

  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET not configured");
  }

  return jwt.sign(
    {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

export const userController = {
  loginUser: async (req: Request, res: Response) => {
    try {
      const { emailOrUsername, password } = req.body;

      // Buscar usuario por email o username
      const user = await User.findOne({
        $or: [
          { email: normalize(emailOrUsername) },
          { username: normalize(emailOrUsername) },
        ],
      }).lean();

      if (!user) {
        return res.status(401).json({
          error: "Invalid credentials",
        });
      }

      // Verificar si el usuario está activo
      if (!user.active) {
        return res.status(401).json({
          error: "Account is deactivated. Please contact support",
        });
      }

      // Verificar contraseña
      const isValidPassword = await comparePassword(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({
          error: "Invalid credentials",
        });
      }

      // Generar token
      const token = generateToken(user);

      // Preparar respuesta sin contraseña
      const userResponse = {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        active: user.active,
        registerDate: user.registerDate,
      };

      res.status(200).json({
        message: "Login successful",
        user: userResponse,
        token,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({
        error: "Internal server error",
      });
    }
  },

  // Función para obtener el perfil del usuario autenticado
  getProfile: async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: "Authentication required",
        });
      }

      const user = await User.findById(req.user.id).select("-password").lean();
      if (!user) {
        return res.status(404).json({
          error: "User not found",
        });
      }

      res.status(200).json({ user });
    } catch (error) {
      console.error("Get profile error:", error);
      res.status(500).json({
        error: "Internal server error",
      });
    }
  },

  // Función para crear admin (solo otro admin puede hacerlo)
  createAdmin: async (req: Request, res: Response) => {
    try {
      const { username, email, password } = req.body;

      // Verificar que quien hace la petición es admin
      if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({
          error: "Only admins can create admin accounts",
        });
      }

      // Verificar dominios bloqueados
      if (isEmailBlocked(email)) {
        return res.status(400).json({
          error: "Email domain not allowed",
          field: "email",
        });
      }

      // Verificar duplicados
      const user = await isUsernameOrEmailTaken(username, email);
      if (user) {
        if (
          user.email === normalize(email) &&
          user.username === normalize(username)
        ) {
          return res.status(409).json({
            error: "Email and Username already taken",
          });
        }
        if (user.email === normalize(email)) {
          return res.status(409).json({
            error: "Email already registered",
            field: "email",
          });
        }
        if (user.username === normalize(username)) {
          return res.status(409).json({
            error: "Username already taken",
            field: "username",
          });
        }
      }

      const hashedPassword = await hashPassword(password);
      const newAdmin = await User.create({
        username: normalize(username),
        email: normalize(email),
        password: hashedPassword,
        role: "admin", // Establecer como admin
      });

      const adminResponse = {
        id: newAdmin._id,
        username: newAdmin.username,
        email: newAdmin.email,
        role: newAdmin.role,
        active: newAdmin.active,
        registerDate: newAdmin.registerDate,
      };

      res.status(201).json({
        message: "Admin created successfully",
        user: adminResponse,
      });
    } catch (error) {
      console.error("Error creating admin:", error);
      res.status(500).json({
        error: "Internal server error",
      });
    }
  },

  createUser: async (req: Request, res: Response) => {
    try {
      const { username, email, password } = req.body;

      // Bloqueo de dominio
      if (isEmailBlocked(email)) {
        return res
          .status(400)
          .json({ error: "Email domain not allowed", field: "email" });
      }

      // Verificar duplicados
      const user = await isUsernameOrEmailTaken(username, email);
      if (user) {
        if (
          user.email === normalize(email) &&
          user.username === normalize(username)
        )
          return res
            .status(400)
            .json({ error: "Email and Username already taken" });
        if (user.email === normalize(email))
          return res
            .status(409)
            .json({ error: "Email already registered", field: "email" });
        if (user.username === normalize(username))
          return res
            .status(409)
            .json({ error: "Username already taken", field: "username" });
      }

      const hashedPassword = await hashPassword(password);
      const newUser = await User.create({
        username: normalize(username),
        email: normalize(email),
        password: hashedPassword,
      });

      const userResponse = {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        active: newUser.active,
        registerDate: newUser.registerDate,
      };

      res
        .status(201)
        .json({ message: "User created successfully", user: userResponse });
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  getUsers: async (_req: Request, res: Response) => {
    try {
      const users = await User.find().select("-password").lean();
      if (!users || users.length === 0) {
        return res.status(200).json({ message: "No users found", users: [] });
      }
      res.status(200).json({ users });
    } catch (error) {
      console.error("Error getting users:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  getUser: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const user = await User.findById(id).select("-password").lean();
      if (!user) return res.status(404).json({ error: "User not found" });
      res.status(200).json(user);
    } catch (error) {
      console.error("Error getting user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  updateUser: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { newUsername, newEmail, newPassword, currentPassword } = req.body;

      const user = await User.findById(id);
      if (!user) return res.status(404).json({ error: "User not found" });

      const isCurrentValidPassword = await comparePassword(
        currentPassword,
        user.password
      );

      if (!isCurrentValidPassword)
        return res.status(400).json({ error: "Incorrect current password" });

      const updateData: any = {};

      if (newUsername && normalize(newUsername) !== user.username) {
        updateData.username = normalize(newUsername);
      }

      if (newEmail && normalize(newEmail) !== user.email) {
        updateData.email = normalize(newEmail);
      }

      if (newPassword) {
        const isSamePassword = await comparePassword(
          newPassword,
          user.password
        );
        if (!isSamePassword) {
          updateData.password = await hashPassword(newPassword);
        }
      }

      if (updateData.username || updateData.email) {
        const conflictUser = await isUsernameOrEmailTaken(
          updateData.username,
          updateData.email,
          id
        );
        if (conflictUser) {
          if (updateData.email && conflictUser.email === normalize(newEmail))
            return res
              .status(409)
              .json({ error: "Email already registered", field: "email" });
          if (
            updateData.username &&
            conflictUser.username === updateData.username
          )
            return res
              .status(409)
              .json({ error: "Username already taken", field: "username" });
        }
      }

      if (Object.keys(updateData).length === 0)
        return res.status(400).json({ error: "No changes detected" });

      const updatedUser = await User.findByIdAndUpdate(id, updateData, {
        new: true,
      })
        .select("-password")
        .lean();

      res
        .status(200)
        .json({ message: "User updated successfully", user: updatedUser });
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  activateUser: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const user = await User.findById(id).lean();
      if (!user) return res.status(404).json({ error: "User not found" });
      if (user.active)
        return res.status(200).json({ message: "User is already active" });

      const updatedUser = await User.findByIdAndUpdate(
        id,
        { active: true },
        { new: true }
      )
        .select("-password")
        .lean();
      res
        .status(200)
        .json({ message: "User activated successfully", user: updatedUser });
    } catch (error) {
      console.error("Error activating user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  deactivateUser: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const user = await User.findById(id).lean();
      if (!user) return res.status(404).json({ error: "User not found" });
      if (!user.active)
        return res.status(200).json({ message: "User is already inactive" });

      const updatedUser = await User.findByIdAndUpdate(
        id,
        { active: false },
        { new: true }
      )
        .select("-password")
        .lean();
      res
        .status(200)
        .json({ message: "User deactivated successfully", user: updatedUser });
    } catch (error) {
      console.error("Error deactivating user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
};
