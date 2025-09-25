import {
  activeUser,
  createUser,
  getUser,
  getUsers,
  updateUser,
} from "@/controllers/user/userController";
import { Router } from "express";

const router = Router();

router.get("/", getUsers);
router.get("/:id", getUser);
router.post("/", createUser);
router.put("/:id", updateUser);
router.patch("/:id", activeUser)

export default router;
