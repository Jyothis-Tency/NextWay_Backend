import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import HttpStatusCode from "../Enums/httpStatusCodes";
import User from "../Models/userModel";
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
const adminEmail = process.env.ADMIN_EMAIL!;
const adminPassword = process.env.ADMIN_PASSWORD!;
import { adminRefreshTokenHandle } from "../Utils/adminRefreshTokenVerification";
import Admin from "../Models/AdminModel";

const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_TOKEN_SECRET as string;

export const adminAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log("adminAuth");
    // console.log(req.headers);

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ message: "Access token is required", role: null });
      return;
    }

    const token = authHeader.split(" ")[1];
    // const token = "";
    console.log("token", token);
    jwt.verify(token, ACCESS_TOKEN_SECRET, async (err, decoded) => {
        if (err) {
          console.log("errrr admin");
          
        return adminRefreshTokenHandle(req, res, next);
      }
      const { _id, role } = decoded as jwt.JwtPayload;

      // Check if admin exists and is not blocked
      const admin = await Admin.findOne({
        _id: new mongoose.Types.ObjectId(_id),
      });
      // console.log("admin in adminAuth", admin);

      if (!admin) {
        console.log("admin not found");
        
        return res
          .status(403)
          .json({ message: "Your are not admin", role: role });
      }

      next();
    });
  } catch (error) {
    res.status(401).json({ message: "Unauthorized access", role: null });
  }
};
