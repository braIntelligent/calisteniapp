import { IUser } from "@/interfaces/user.interface";
import { User } from "@/models/user.schema";
import { Request, Response } from "express";
import bcrypt from "bcrypt";

const createUser = async (req: Request, res: Response) => {
  try {
    const { username, password, email } = req.body;

    const existingUser = await User.findOne({
      $or: [
        { email: email.toLocaleLowerCase() },
        { username: username.toLocaleLowerCase() },
      ],
    });
    if (existingUser) {
      if (
        existingUser.email.toLocaleLowerCase() === email.toLocaleLowerCase()
      ) {
        return res
          .status(409)
          .json({ error: "Email already registered", field: "email" });
      }
      if (
        existingUser.username.toLocaleLowerCase() ===
        username.toLocaleLowerCase()
      ) {
        return res
          .status(409)
          .json({ error: "Username already taken", field: "username" });
      }
    }

    const emailDomain = email.split("@")[1];
    const blockedDomain = ["tempmail.com", "10minutemail.com"];
    if (blockedDomain.includes(emailDomain)) {
      return res.status(400).json({
        error: "Email domain not allowed",
        field: "email",
      });
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = await User.create({
      username: username.toLocaleLowerCase().trim(),
      password: hashedPassword,
      email: email.toLocaleLowerCase().trim(),
    });

    const userResponse = {
      id: newUser._id,
      username: newUser.username,
      email: newUser.email,
      active: newUser.active,
      registerDate: newUser.registerDate,
    };
    res
      .status(201)
      .json({ message: "User created succesfully", user: userResponse });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getUsers = async (req: Request, res: Response) => {
  try {
    const user = await User.find().select("-password").lean();
    if (!user) {
      res.status(200).json({ message: "no users found" });
    }
    res.status(200).json({ users: user });
  } catch (error) {
    console.log("Error getting users");
    res.status(500).json({ error: "Internal server error" });
  }
};

const getUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const existingUser = await User.findById(id).select("-password").lean();

    if (!existingUser) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.status(200).json(existingUser);
  } catch (error) {
    console.log(`Error getting user: ${error}`);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const body = req.body;

    if (!body) {
      return res.status(400).json({ error: "No fields provided for update" });
    }

    const { username, email, password } = body;

    const existingUser = await User.findById(id);

    if (!existingUser) {
      return res.status(404).json({ error: "User  not found" });
    }

    const updateData: Partial<{
      username: string;
      email: string;
      password: string;
    }> = {};
    if (
      username &&
      username.trim().length > 8 &&
      username.trim() !== existingUser?.username
    ) {
      updateData.username = username.trim().toLocaleLowerCase();
    }
    if (
      email &&
      email.trim().length > 8 &&
      email.trim() !== existingUser?.email
    ) {
      updateData.email = email.trim().toLocaleLowerCase();
    }
    if (password && password.trim().length > 0) {
      updateData.password = await bcrypt.hash(password, 12);
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: "No changes detected" });
    }

    const updatedUser = await User.findByIdAndUpdate(id, updateData, {
      new: true,
    })
      .select("-password")
      .lean();

    return res.status(200).json({
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error(`Error updating user: ${(error as Error).message}`);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const activeUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const userExisting = (await User.findById(id)) as IUser;
    if (!userExisting) {
      return res.status(400).json({ message: "User not found" });
    }
    if (userExisting.active) {
      return res.status(200).json({ message: "User is active" });
    }
    const user = await User.findByIdAndUpdate(
      id,
      {
        active: true,
      },
      { new: true }
    )
      .select("-password")
      .lean();
    return res.status(200).json({ message: "User activated.", user });
  } catch (error) {
    console.log(`Error when activating: ${error}`);
    res.status(500).json({ error: "Internal server error" });
  }
};

const deleteUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userExisting = await User.findById(id);
  if (!userExisting) {
    return res.status(400).json({ message: "User not found" });
  }

  if (userExisting.active) {
  }

  try {
    const deleteUser = await User.findByIdAndUpdate(
      id,
      { active: false },
      { new: true }
    )
      .select("-password")
      .lean();
    res.status(200).json({ message: "successfully removed", deleteUser });
  } catch (error) {
    console.log(`Error when deleting: ${error}`);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const userController = {
  createUser,
  getUsers,
  getUser,
  updateUser,
  activeUser,
  deleteUser,
};
