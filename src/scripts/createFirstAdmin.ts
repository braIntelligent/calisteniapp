// src/scripts/createFirstAdmin.ts
import mongoose from "mongoose";
import { User } from "@/models/user.schema";
import { hashPassword, normalize } from "@/utils/user.helpers";
import "dotenv/config";

async function createFirstAdmin() {
  try {
    // Conectar a la base de datos
    const uri = process.env.MONGODB_URI as string;
    await mongoose.connect(uri);
    console.log("Connected to database");

    // Verificar si ya existe un admin
    const existingAdmin = await User.findOne({ role: "admin" });
    if (existingAdmin) {
      console.log("Admin user already exists:");
      console.log(`Username: ${existingAdmin.username}`);
      console.log(`Email: ${existingAdmin.email}`);
      await mongoose.disconnect();
      return;
    }

    // Datos del primer admin
    const adminData = {
      username: "admin",
      email: "admin@example.com",
      password: "Admin123!", // Cambiar por una contraseña segura
      role: "admin" as const,
    };

    // Verificar si el username o email ya existen
    const existingUser = await User.findOne({
      $or: [
        { username: normalize(adminData.username) },
        { email: normalize(adminData.email) }
      ]
    });

    if (existingUser) {
      console.log("Username or email already taken. Please modify the script.");
      await mongoose.disconnect();
      return;
    }

    // Crear el admin
    const hashedPassword = await hashPassword(adminData.password);
    const admin = await User.create({
      username: normalize(adminData.username),
      email: normalize(adminData.email),
      password: hashedPassword,
      role: adminData.role,
    });

    console.log("First admin created successfully!");
    console.log(`ID: ${admin._id}`);
    console.log(`Username: ${admin.username}`);
    console.log(`Email: ${admin.email}`);
    console.log(`Role: ${admin.role}`);
    
    console.log("\n⚠️  IMPORTANT: Change the password after first login!");
    console.log(`Default password: ${adminData.password}`);

  } catch (error) {
    console.error("Error creating first admin:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from database");
  }
}

// Ejecutar el script
createFirstAdmin();