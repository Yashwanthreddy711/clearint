import { Router } from "express";
import { logout, register, login, me } from "../controllers/authController";
import { authMiddleware } from "../middleware/auth.middleware";
const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", authMiddleware, me);
router.post("/logout", logout);

export default router;