// src/server/server.ts - CON SWAGGER INTEGRADO
import express, { NextFunction, Request, Response } from "express";
import userRouter from "@/routes/user.routes";
import { swaggerUi, specs } from "@/config/swagger.config";

const app = express();

// Middlewares
app.use(express.json());

// Swagger Documentation
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(specs, {
    explorer: true,
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "WorkOut Management API Documentation",
    swaggerOptions: {
      filter: true,
      showRequestHeaders: true,
      showCommonExtensions: true,
      tryItOutEnabled: true,
    },
  })
);

// Ruta para obtener el JSON de la documentación
app.get("/api-docs.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(specs);
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
  });
});

// API Routes
app.use("/api/v1/users", userRouter);
// app.use("/api/v1/bars", barRouter) // Para futuro uso

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to WorkOut Management API",
    version: "1.0.0",
    documentation: "/api-docs",
    health: "/health",
  });
});

// 404 handler - Express 5 compatible
app.use((req, res, next) => {
  res.status(404).json({
    error: "Route not found",
    message: `The route ${req.originalUrl} does not exist on this server`,
    availableRoutes: {
      documentation: "/api-docs",
      health: "/health",
      users: "/api/v1/users",
    },
  });
});

// Error handler
app.use((error: any, req: Request, res: Response, next: NextFunction) => {
  console.error("Unhandled error:", error);
  res.status(500).json({
    error: "Internal server error",
    message:
      process.env.NODE_ENV === "development"
        ? error.message
        : "Something went wrong",
  });
});

export default app;
