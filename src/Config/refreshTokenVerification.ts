import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { createToken } from "./jwtConfig";

dotenv.config();

const secret_key = process.env.SECRET_KEY as string;

const refreshTokenHandler = (req: Request, res: Response) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: "User ID is required." });
  }

  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ message: "Refresh token is missing." });
  }

  jwt.verify(refreshToken, secret_key, (err: jwt.VerifyErrors | null) => {
    if (err) {
      console.error("Error verifying refresh token:", err.message);
      return res
        .status(401)
        .json({ message: "Invalid or expired refresh token." });
    }

    const newAccessToken = createToken(userId, "User");

    res.json({ accessToken: newAccessToken });
  });
};

export { refreshTokenHandler };
