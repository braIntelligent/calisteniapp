// src/middlewares/auth.middleware.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User } from "@/models/user.schema";

// Extender la interfaz Request para incluir user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        username: string;
        email: string;
        role: "admin" | "user";
        active: boolean;
      };
    }
  }
}

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        error: "Access denied. No token provided" 
      });
    }

    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      return res.status(500).json({ 
        error: "JWT secret not configured" 
      });
    }

    // Verificar y decodificar el token
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      username: string;
      email: string;
      role: "admin" | "user";
    };

    // Verificar que el usuario aún existe y esté activo
    const user = await User.findById(decoded.id).select("-password").lean();
    if (!user) {
      return res.status(401).json({ 
        error: "User not found" 
      });
    }

    if (!user.active) {
      return res.status(401).json({ 
        error: "User account is deactivated" 
      });
    }

    // Agregar información del usuario al request
    req.user = {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role,
      active: user.active,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(403).json({ 
        error: "Invalid token" 
      });
    }
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(403).json({ 
        error: "Token expired" 
      });
    }
    
    console.error("Auth middleware error:", error);
    res.status(500).json({ 
      error: "Internal server error" 
    });
  }
};

// Middleware para verificar si el usuario es admin
export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({ 
      error: "Authentication required" 
    });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({ 
      error: "Admin privileges required" 
    });
  }

  next();
};

// Middleware para verificar si el usuario puede acceder a su propio recurso o es admin
export const requireOwnershipOrAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({ 
      error: "Authentication required" 
    });
  }

  const { id } = req.params;
  
  // Si es admin o es el propio usuario, puede continuar
  if (req.user.role === "admin" || req.user.id === id) {
    return next();
  }

  return res.status(403).json({ 
    error: "Access denied. You can only access your own resources" 
  });
};