import { Router } from "express";
import { logout, refreshAccessToken, register } from "../controllers/authController";
import { login } from "../controllers/authController";
const router = Router();

// register
router.post("/register", register);

// login
router.post("/login", login);

// refresh
router.post("/refresh", refreshAccessToken);

// logout
router.post("/logout", logout);

export default router;