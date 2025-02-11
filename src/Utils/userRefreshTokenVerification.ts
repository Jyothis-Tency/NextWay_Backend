import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { createAccessToken } from "../Config/jwtConfig";
import User from "../Models/userModel";
import mongoose from "mongoose";

dotenv.config();

const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_TOKEN_SECRET as string;

export const userRefreshTokenHandle = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    console.log("userRefreshTokenHandle ");
    
    const refreshToken = req.headers["x-refresh-token"] as string;
    console.log(refreshToken);
    
    if (!refreshToken) {
      console.log("!refreshToken");
      
      res
        .status(401)
        .json({ message: "Refresh token is required", role: null });
      return;
    }

    jwt.verify(refreshToken, REFRESH_TOKEN_SECRET, async (err, decoded) => {
      if (err) {
        console.log("Invalid refresh token");
        res.status(401).json({ message: "Invalid refresh token", role: null });
        return;
      }

      const { _id, role } = decoded as { _id: string; role: string };

      // Check if user exists and is not blocked
      const user = await User.findOne({
              user_id: new mongoose.Types.ObjectId(_id),
            });
      if (!user || user.isBlocked) {
         console.log("!user || user.isBlocked");
        res
          .status(403)
          .json({ message: "Your account is blocked by Admin", role: role });
        return;
      }

      const newAccessToken = createAccessToken(_id, role);
      res.setHeader("x-access-token", newAccessToken);

      next();
    });
  } catch (error) {
    console.log("Unauthorized access");
    res.status(401).json({ message: "Unauthorized access", role: null });
  }
};
