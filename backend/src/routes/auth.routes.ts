import { Router } from "express";

const router = Router();

// register
router.post("/register", (req, res) => {
  res.json({ message: "register route working" });
});

// login
router.post("/login", (req, res) => {
  res.json({ message: "login route working" });
});

// refresh
router.post("/refresh", (req, res) => {
  res.json({ message: "refresh route working" });
});

// logout
router.post("/logout", (req, res) => {
  res.json({ message: "logout route working" });
});

export default router;