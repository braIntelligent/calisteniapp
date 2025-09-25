import mongoose from "mongoose";
import "dotenv/config";

export const connectionToDatabase = async () => {
  const uri = process.env.MONGODB_URI as string;
  try {
    await mongoose.connect(uri);
    console.log("connect to database");
  } catch (error) {
    console.log(error);
  }
};
