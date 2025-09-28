import { userController } from "@/controllers/user.controller";
import {
  createUserSchemaZod,
  updateUserSchemaZod,
} from "@/validations/schemas/user.schemazod";
import { validateZod } from "@/validations/user.validation";
import { Router } from "express";

const router = Router();

//public routes
router.post(
  "/register",
  validateZod(createUserSchemaZod),
  userController.createUser
);
// router.post("/login", userController.loginUser);

//admin private routes (falta middelware de jwt, verificar rol)
router.get("/", userController.getUsers);
router.get("/:id", userController.getUser);
router.put("/:id", validateZod(updateUserSchemaZod), userController.updateUser);
router.patch("/:id/activate", userController.activateUser);
router.delete("/:id/deactivate", userController.deactivateUser);

export default router;
