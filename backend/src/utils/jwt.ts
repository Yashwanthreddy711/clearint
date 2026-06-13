import jwt, { SignOptions } from "jsonwebtoken";

const accessExpiry: SignOptions["expiresIn"] =
  (process.env.ACCESS_TOKEN_EXPIRY as SignOptions["expiresIn"]) || "15m";

const refreshExpiry: SignOptions["expiresIn"] =
  (process.env.REFRESH_TOKEN_EXPIRY as SignOptions["expiresIn"]) || "30d";

export const generateAccessToken = (userId: string) => {
  return jwt.sign(
    { userId },
    process.env.JWT_ACCESS_SECRET!,
    { expiresIn: accessExpiry }
  );
};

export const generateRefreshToken = (userId: string) => {
  return jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: refreshExpiry }
  );
};
