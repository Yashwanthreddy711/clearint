import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";


const router = Router();

router.get("/profile", authMiddleware, (req, res) => {
  return res.json({
    message: "Protected route working",
    user: req.user,
  });
});

export default router;