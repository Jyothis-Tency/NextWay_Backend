import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { createAccessToken } from "../Config/jwtConfig";
import Admin from "../Models/AdminModel";
import mongoose from "mongoose";

dotenv.config();

const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_TOKEN_SECRET as string;

export const adminRefreshTokenHandle = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    console.log("adminRefreshTokenHandle ");

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

      const { _id, role } = decoded as jwt.JwtPayload;
      console.log(_id, role);

      // Check if admin exists and is not blocked
      const admin = await Admin.findOne({
        _id: new mongoose.Types.ObjectId(_id),
      });
      if (!admin) {
        console.log("Your are not admin");
        res.status(403).json({ message: "Admin not found", role: role });
        return;
      }

      if ("admin" != role) {
        res.status(403).json({
          message: "Your role is not matching",
          role: role,
        });
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
