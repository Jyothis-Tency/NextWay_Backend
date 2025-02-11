import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import HttpStatusCode from "../Enums/httpStatusCodes";
import Company from "../Models/companyModel";
import { companyRefreshTokenHandle } from "../Utils/companyRefreshTokenVerification";
import mongoose from "mongoose";

const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_TOKEN_SECRET as string;

const companyAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log("companyAuth");
    
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ message: "Access token is required", role: null });
      return;
    }

    const token = authHeader.split(" ")[1];

    jwt.verify(token, ACCESS_TOKEN_SECRET, async (err, decoded) => {
      if (err) {
        return companyRefreshTokenHandle(req, res, next);
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
        return res
          .status(403)
          .json({ message: "Your account is blocked by Admin", role: role });
      }

      next();
    });
  } catch (error) {
     res.status(401).json({ message: "Unauthorized access", role: null });
  }
};

export default companyAuth;
