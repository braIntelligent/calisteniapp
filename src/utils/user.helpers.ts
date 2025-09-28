import { User } from "@/models/user.schema";
import bcrypt from "bcrypt";

export const normalize = (str: string) => str.trim().toLowerCase();

export const isEmailBlocked = (email: string) => {
  const blockedDomains = ["tempmail.com", "10minutemail.com"];
  const domain = email.split("@")[1];
  return blockedDomains.includes(domain);
};

export const hashPassword = async (newPassword: string) => {
  return await bcrypt.hash(newPassword, 14);
};

export const comparePassword = async (
  bodyPassword: string,
  dbPassword: string
) => {
  return await bcrypt.compare(bodyPassword, dbPassword);
};

export const isUsernameOrEmailTaken = async (
  username?: string,
  email?: string,
  excludeUserId?: string
) => {
  const query: any = { $or: [] };
  if (username) query.$or.push({ username: normalize(username) });
  if (email) query.$or.push({ email: normalize(email) });

  if (query.$or.length === 0) return false;

  const existingUser = await User.findOne(query).lean();
  if (!existingUser) return false;
  if (excludeUserId && existingUser._id.toString() === excludeUserId)
    return false;

  return existingUser;
};
