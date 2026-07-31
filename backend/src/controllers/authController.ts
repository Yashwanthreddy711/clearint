import { Request, Response } from "express";
import prisma from "../db/prisma";
import { registerSchema } from "../validators/auth.validator";
import { hashPassword } from "../utils/password";
import { generateAccessToken } from "../utils/jwt";
import { loginSchema } from "../validators/auth.validator";
import { comparePassword } from "../utils/password";

export const register = async (req: Request, res: Response) => {
  try {
    const parsedData = registerSchema.safeParse(req.body);

    if (!parsedData.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: parsedData.error.issues,
      });
    } 

    const { username, email, password, mobileNo } = parsedData.data;

    // check existing user
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username },
          mobileNo ? { mobileNo } : undefined,
        ].filter(Boolean) as any,
      },
    });

    if (existingUser) {
      return res.status(409).json({
        message: "User already exists with email/username/mobile",
      });
    }

    // hash password
    const passwordHash = await hashPassword(password);

    // create user
    const user = await prisma.user.create({
      data: {
        username,
        email,
        mobileNo: mobileNo ?? null,
        passwordHash,
      },
    });

    const accessToken = generateAccessToken(user.id);

    return res.status(201).json({
      message: "User registered successfully",
      accessToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const parsedData = loginSchema.safeParse(req.body);

    if (!parsedData.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: parsedData.error.flatten(),
      });
    }

    const { email, password } = parsedData.data;

    // find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    // check status
    if (user.status !== "ACTIVE") {
      return res.status(403).json({
        message: `User is ${user.status}`,
      });
    }

    // compare password
    const isPasswordValid = await comparePassword(password, user.passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    const accessToken = generateAccessToken(user.id);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
      },
    });

    return res.status(200).json({
      message: "Login successful",
      accessToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const logout = async (_req: Request, res: Response) => {
  try {
    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};