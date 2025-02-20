import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_TOKEN_SECRET as string;
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_TOKEN_SECRET as string;

const createAccessToken = (
  _id: mongoose.Types.ObjectId | string,
  role: string
): string => {
  return jwt.sign({ _id, role }, ACCESS_TOKEN_SECRET, { expiresIn: "1h" });
};

const createRefreshToken = (
  _id: mongoose.Types.ObjectId | string,
  role: string
): string => {
  return jwt.sign({ _id, role }, REFRESH_TOKEN_SECRET, { expiresIn: "7d" });
};

export { createAccessToken, createRefreshToken };
