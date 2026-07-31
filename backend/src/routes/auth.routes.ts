import { Router } from "express";
import { logout, register, login } from "../controllers/authController";
const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);

export default router;