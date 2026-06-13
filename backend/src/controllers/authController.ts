import { Request, Response } from "express";
import prisma from "../db/prisma";
import { registerSchema } from "../validators/auth.validator";
import { hashPassword } from "../utils/password";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt";
import { hashToken } from "../utils/hash";
import { loginSchema } from "../validators/auth.validator";
import { comparePassword } from "../utils/password";
import jwt from "jsonwebtoken";

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

    // generate tokens
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);
    const refreshTokenExpiryDays = 30;
    const refreshTokenExpiryMs =
      refreshTokenExpiryDays * 24 * 60 * 60 * 1000;

    // store refresh token in db (hashed)
    await prisma.userRefreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(refreshToken),
        expiresAt: new Date(Date.now() + refreshTokenExpiryMs),
        ipAddress: req.ip || null,
        userAgent: req.headers["user-agent"] || null,
      },
    });

    // set refresh token in cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

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

    // generate tokens
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    const refreshTokenExpiryDays = 30;
    const refreshTokenExpiryMs =
      refreshTokenExpiryDays * 24 * 60 * 60 * 1000;

    // store refresh token hash in DB
    await prisma.userRefreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(refreshToken),
        expiresAt: new Date(Date.now() + refreshTokenExpiryMs),
        ipAddress: req.ip || null,
        userAgent: req.headers["user-agent"] || null,
      },
    });

    // update last login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
      },
    });

    // set refresh token cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: refreshTokenExpiryMs,
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

 
export const refreshAccessToken = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token missing" });
    }

    // verify refresh token signature
    let decoded: any;
    try {
      decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET as string
      );
    } catch (err) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const userId = decoded.userId;

    // check refresh token in DB
    const tokenHash = hashToken(refreshToken);

    const storedToken = await prisma.userRefreshToken.findFirst({
      where: { tokenHash },
    });

    if (!storedToken || !storedToken.isValid || storedToken.revokedAt) {
      return res.status(401).json({ message: "Refresh token revoked/invalid" });
    }

    if (storedToken.expiresAt < new Date()) {
      return res.status(401).json({ message: "Refresh token expired" });
    }

    // generate new access token
    const newAccessToken = generateAccessToken(userId);

    // ROTATION (real-world best practice)
    const newRefreshToken = generateRefreshToken(userId);
    const newRefreshHash = hashToken(newRefreshToken);

    const refreshTokenExpiryDays = 30;
    const refreshTokenExpiryMs =
      refreshTokenExpiryDays * 24 * 60 * 60 * 1000;

    // invalidate old token
    await prisma.userRefreshToken.update({
      where: { id: storedToken.id },
      data: {
        isValid: false,
        revokedAt: new Date(),
      },
    });

    // store new refresh token
    await prisma.userRefreshToken.create({
      data: {
        userId,
        tokenHash: newRefreshHash,
        expiresAt: new Date(Date.now() + refreshTokenExpiryMs),
        ipAddress: req.ip || null,
        userAgent: req.headers["user-agent"] || null,
      },
    });

    // set new refresh token cookie
    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: refreshTokenExpiryMs,
    });

    return res.status(200).json({
      message: "Token refreshed successfully",
      accessToken: newAccessToken,
    });
  } catch (error) {
    console.error("Refresh error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    // even if token missing, clear cookie anyway
    if (!refreshToken) {
      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });

      return res.status(200).json({ message: "Logged out successfully" });
    }

    const tokenHash = hashToken(refreshToken);

    // revoke token in DB
    await prisma.userRefreshToken.updateMany({
      where: {
        tokenHash,
        isValid: true,
      },
      data: {
        isValid: false,
        revokedAt: new Date(),
      },
    });

    // clear cookie
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};