import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ message: "Authorization header missing" });
    }

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Invalid authorization format" });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Access token missing" });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET as string
    ) as { userId: string };

    req.user = { userId: decoded.userId };

    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};