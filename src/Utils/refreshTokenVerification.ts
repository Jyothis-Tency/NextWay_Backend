import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { createAccessToken } from "../Config/jwtConfig";

dotenv.config();

const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_TOKEN_SECRET as string;

const refreshTokenHandler = (req: Request, res: Response) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: "User ID is required." });
  }

  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ message: "Refresh token is missing." });
  }

  jwt.verify(refreshToken, REFRESH_TOKEN_SECRET, (err: jwt.VerifyErrors | null) => {
    if (err) {
      console.error("Error verifying refresh token:", err.message);
      return res
        .status(401)
        .json({ message: "Invalid or expired refresh token." });
    }

    const newAccessToken = createAccessToken(userId, "user");

    res.json({ accessToken: newAccessToken });
  });
};

export { refreshTokenHandler };
