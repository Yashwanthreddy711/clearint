"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = void 0;
const prisma_1 = __importDefault(require("../db/prisma"));
const auth_validator_1 = require("../validators/auth.validator");
const password_1 = require("../utils/password");
const jwt_1 = require("../utils/jwt");
const hash_1 = require("../utils/hash");
const register = async (req, res) => {
    try {
        const parsedData = auth_validator_1.registerSchema.safeParse(req.body);
        if (!parsedData.success) {
            return res.status(400).json({
                message: "Validation failed",
                errors: parsedData.error.issues,
            });
        }
        const { username, email, password, mobileNo } = parsedData.data;
        // check existing user
        const existingUser = await prisma_1.default.user.findFirst({
            where: {
                OR: [
                    { email },
                    { username },
                    mobileNo ? { mobileNo } : undefined,
                ].filter(Boolean),
            },
        });
        if (existingUser) {
            return res.status(409).json({
                message: "User already exists with email/username/mobile",
            });
        }
        // hash password
        const passwordHash = await (0, password_1.hashPassword)(password);
        // create user
        const user = await prisma_1.default.user.create({
            data: {
                username,
                email,
                mobileNo: mobileNo ?? null,
                passwordHash,
            },
        });
        // generate tokens
        const accessToken = (0, jwt_1.generateAccessToken)(user.id);
        const refreshToken = (0, jwt_1.generateRefreshToken)(user.id);
        // store refresh token in db (hashed)
        await prisma_1.default.userRefreshToken.create({
            data: {
                userId: user.id,
                tokenHash: (0, hash_1.hashToken)(refreshToken),
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            },
        });
        // set refresh token in cookie
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: true, // in localhost you can make false
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
    }
    catch (error) {
        console.error("Register error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
exports.register = register;
//# sourceMappingURL=authController.js.map