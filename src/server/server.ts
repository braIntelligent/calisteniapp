import express, { NextFunction, Request, Response } from "express";
import userRouter from "@/routes/user.routes";

const app = express();
app.use(express.json());

app.use("/api/v1/users", userRouter);
// app.use("api/v1/bars", barRouter)

export default app;
