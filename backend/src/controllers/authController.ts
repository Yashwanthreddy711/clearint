import { Request, Response } from "express";
import prisma from "../db/prisma";
import { registerSchema } from "../validators/auth.validator";
import { hashPassword } from "../utils/password";
import { generateAccessToken } from "../utils/jwt";
import { loginSchema } from "../validators/auth.validator";
import { comparePassword } from "../utils/password";

const logAuthEvent = (stage: string, details: Record<string, unknown>) => {
  console.log(`[AUTH] ${stage}`, details);
};

const logAuthError = (stage: string, error: unknown, req: Request) => {
  console.error(`[AUTH][ERROR] ${stage}`, {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.headers["user-agent"],
    email: req.body?.email,
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });
};

export const register = async (req: Request, res: Response) => {
  try {
    logAuthEvent("register:start", {
      email: req.body?.email,
      username: req.body?.username,
    });

    const parsedData = registerSchema.safeParse(req.body);

    if (!parsedData.success) {
      logAuthEvent("register:validation_failed", {
        issues: parsedData.error.issues,
      });

      return res.status(400).json({
        message: "Validation failed",
        errors: parsedData.error.issues,
      });
    }

    const { username, email, password, mobileNo } = parsedData.data;

    // logAuthEvent("register:validation_ok", {
    //   email,
    //   username,
    // });

    // // check existing user
    // logAuthEvent("register:check_existing_user", {
    //   email,
    //   username,
    // });

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
      // logAuthEvent("register:user_exists", {
      //   email,
      //   username,
      // });

      return res.status(409).json({
        message: "User already exists with email/username/mobile",
      });
    }

    // logAuthEvent("register:hash_password", {
    //   email,
    // });

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

    // logAuthEvent("register:user_created", {
    //   userId: user.id,
    //   email: user.email,
    // });

    const accessToken = generateAccessToken(user.id);

    // logAuthEvent("register:success", {
    //   userId: user.id,
    //   email: user.email,
    // });

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
    logAuthError("register:exception", error, req);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    logAuthEvent("login:start", {
      email: req.body?.email,
    });

    const parsedData = loginSchema.safeParse(req.body);

    if (!parsedData.success) {
      logAuthEvent("login:validation_failed", {
        issues: parsedData.error.flatten(),
      });

      return res.status(400).json({
        message: "Validation failed",
        errors: parsedData.error.flatten(),
      });
    }

    const { email, password } = parsedData.data;

    logAuthEvent("login:validation_ok", {
      email,
    });

    // find user
    logAuthEvent("login:find_user", {
      email,
    });

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      logAuthEvent("login:user_not_found", {
        email,
      });

      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    if (user.status !== "ACTIVE") {
      logAuthEvent("login:user_inactive", {
        userId: user.id,
        status: user.status,
      });

      return res.status(403).json({
        message: `User is ${user.status}`,
      });
    }

    logAuthEvent("login:compare_password", {
      userId: user.id,
    });

    const isPasswordValid = await comparePassword(password, user.passwordHash);

    if (!isPasswordValid) {
      logAuthEvent("login:invalid_password", {
        userId: user.id,
      });

      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    logAuthEvent("login:generate_access_token", {
      userId: user.id,
    });

    const accessToken = generateAccessToken(user.id);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
      },
    });

    logAuthEvent("login:success", {
      userId: user.id,
      email: user.email,
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
    logAuthError("login:exception", error, req);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const me = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
      },
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid session" });
    }

    return res.status(200).json({
      message: "Session valid",
      user,
    });
  } catch (error) {
    logAuthError("me:exception", error, req);
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