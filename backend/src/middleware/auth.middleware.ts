import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const cookieToken = req.cookies?.accessToken;
    const authHeader = req.headers.authorization;
    const headerToken =
      authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
    const token = cookieToken || headerToken;

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