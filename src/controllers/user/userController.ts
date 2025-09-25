import { IUser } from "@/interfaces/user.interface";
import { User } from "@/models/user/user.schema";
import { Request, Response } from "express";
import bcrypt from "bcrypt";

export const createUser = async (req: Request, res: Response) => {
  try {
    const { username, password, email } = req.body as IUser;
    const existUser = await User.findOne({ email });
    if (existUser) {
      return res.status(400).json({ error: "User already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create<IUser>({
      username,
      password: hashedPassword,
      email,
      registerDate: new Date(),
    });
    return res.status(201).json(newUser);
  } catch (error) {
    console.log(error);
  }
};

export const getUsers = async (req: Request, res: Response) => {
  try {
    const user = await User.find();
    res.json(user);
  } catch (error) {}
};

export const getUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const existUser = await User.findById(id);
    if (!existUser) {
      res.status(404).json({ error: "User no exists" });
      return;
    }
    res.status(200).json(existUser);
  } catch (error) {
    console.log(error);
  }
};

export const updateUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const updateUser = await User.findByIdAndUpdate(
      id,
      {
        username,
        email,
        password: hashedPassword,
      },
      { new: true }
    );
    if (!updateUser) {
      res.status(400).json({ error: "User no exists" });
      return;
    }
    res.send({ updateUser });
  } catch (error) {
    console.log(error);
  }
};

export const activeUser = async (req: Request, res: Response) => {
  const { id, active } = req.body;
  try {
    const user = await User.findByIdAndUpdate(id, {
      active: false,
    });
    res.send({message: `${}`})
  } catch (error) {}
};

// patch activa
// put modifica
// delete elimina

// sao "$2b$10$VzL2cpaH2dqXVR0U0F17TOGbcrmABs3IB/PtJraQLFekPVJsrf7YS",
