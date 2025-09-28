import { Request, Response } from "express";
import { User } from "@/models/user.schema";
import {
  normalize,
  hashPassword,
  isEmailBlocked,
  isUsernameOrEmailTaken,
  comparePassword,
} from "@/utils/user.helpers";

export const userController = {
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
      const existingUser = await isUsernameOrEmailTaken(username, email);
      if (existingUser) {
        if (
          existingUser.email === normalize(email) &&
          existingUser.username === normalize(username)
        )
          return res
            .status(400)
            .json({ error: "Email and Username already taken" });
        if (existingUser.email === normalize(email))
          return res
            .status(409)
            .json({ error: "Email already registered", field: "email" });
        if (existingUser.username === normalize(username))
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

      const existingUser = await User.findById(id);
      if (!existingUser)
        return res.status(404).json({ error: "User not found" });

      const isCurrentValidPassword = await comparePassword(
        currentPassword,
        existingUser.password
      );

      if (!isCurrentValidPassword)
        return res.status(400).json({ error: "Incorrect current password" });

      const updateData: any = {};

      if (newUsername && normalize(newUsername) !== existingUser.username) {
        updateData.username = normalize(newUsername);
      }

      if (newEmail && normalize(newEmail) !== existingUser.email) {
        updateData.email = normalize(newEmail);
      }

      if (newPassword) {
        const isSamePassword = await comparePassword(
          newPassword,
          existingUser.password
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
