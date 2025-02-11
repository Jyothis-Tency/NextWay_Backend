import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { createAccessToken } from "../Config/jwtConfig";
import Company from "../Models/companyModel";
import mongoose from "mongoose";

dotenv.config();

const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_TOKEN_SECRET as string;

export const companyRefreshTokenHandle = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const refreshToken = req.headers["x-refresh-token"] as string;
    if (!refreshToken) {
      res
        .status(401)
        .json({ message: "Refresh token is required", role: null });
      return;
    }

    jwt.verify(refreshToken, REFRESH_TOKEN_SECRET, async (err, decoded) => {
      if (err) {
        res.status(401).json({ message: "Invalid refresh token", role: null });
        return;
      }

      const { _id, role } = decoded as {
        _id: string;
        role: string;
      };

      // Check if company exists and is not blocked
      const company = await Company.findOne({
              company_id: new mongoose.Types.ObjectId(_id),
            });
      if (!company || company.isBlocked) {
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
    res.status(401).json({ message: "Unauthorized access", role: null });
  }
};
