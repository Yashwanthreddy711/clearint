import { Router } from "express";
import {
  getMe,
  logout,
  refreshAccessToken,
  register,
  login,
} from "../controllers/authController";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

// register
router.post("/register", register);

// login
router.post("/login", login);

// refresh
router.post("/refresh", refreshAccessToken);

// current user (requires auth cookie)
router.get("/me", authMiddleware, getMe);

// logout
router.post("/logout", logout);

export default router;