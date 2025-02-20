import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import HttpStatusCode from "../Enums/httpStatusCodes";
import User from "../Models/userModel";
import mongoose from "mongoose";

import { userRefreshTokenHandle } from "../Utils/userRefreshTokenVerification";

const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_TOKEN_SECRET as string;

export const userAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log("userAuth");
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
        return userRefreshTokenHandle(req, res, next);
      }
      const { _id, role } = decoded as jwt.JwtPayload;
      console.log("token role", role);

      // Check if user exists and is not blocked
      const user = await User.findOne({
        user_id: new mongoose.Types.ObjectId(_id),
      });
      // console.log("user in userAuth", user);

      if (!user || user?.isBlocked) {
        return res
          .status(403)
          .json({ message: "Your account is blocked by Admin", role: role });
      }
      if ("user" != role) {
        return res
          .status(403)
          .json({ message: "Your role is not matching", role: role });
      }

      next();
    });
  } catch (error) {
    res.status(401).json({ message: "Unauthorized access", role: null });
  }
};
