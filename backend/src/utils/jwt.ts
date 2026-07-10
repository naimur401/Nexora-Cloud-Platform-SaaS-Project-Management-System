import jwt from "jsonwebtoken";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "nexora_access_secret_2024";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "nexora_refresh_secret_2024";

export const generateAccessToken = (payload: object): string =>
  jwt.sign(payload, ACCESS_SECRET, { expiresIn: "15m" });

export const generateRefreshToken = (payload: object): string =>
  jwt.sign(payload, REFRESH_SECRET, { expiresIn: "7d" });

export const verifyAccessToken = (token: string): any => {
  try { return jwt.verify(token, ACCESS_SECRET); }
  catch { return null; }
};

export const verifyRefreshToken = (token: string): any => {
  try { return jwt.verify(token, REFRESH_SECRET); }
  catch { return null; }
};
