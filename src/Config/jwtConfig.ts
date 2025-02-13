import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import HTTP_statusCode from "../Enums/httpStatusCodes";

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

// const verifyJwtToken = (token: string, secret: string): string | jwt.JwtPayload => {
//   try {
//     return jwt.verify(token, secret);
//   } catch (error) {
//     return ""
//   }
// }

// const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const accessToken: string = req.cookies.AccessToken;
//     if (accessToken) {
//       jwt.verify(accessToken, ACCESS_TOKEN_SECRET, async (err, decoded) => {
//         if (err) {
//           await handleRefreshToken(req, res, next);
//         } else {
//           const { role } = decoded as jwt.JwtPayload;
//           if (role !== "user") {
//             return res
//               .status(HTTP_statusCode.UNAUTHORIZED)
//               .json({ message: "Access denied. Insufficient role." });
//           }
//           next();
//         }
//       });
//     } else {
//       await handleRefreshToken(req, res, next);
//     }
//   } catch (error) {
//     res
//       .status(HTTP_statusCode.UNAUTHORIZED)
//       .json({ message: "Access denied. Access token not valid." });
//   }
// };

// const handleRefreshToken = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   const refreshToken: string = req.cookies.RefreshToken;
//   if (refreshToken) {
//     jwt.verify(refreshToken, REFRESH_TOKEN_SECRET, (err, decoded) => {
//       if (err) {
//         return res
//           .status(HTTP_statusCode.UNAUTHORIZED)
//           .json({ message: "Access denied. Refresh token not valid." });
//       } else {
//         const { user_id, role } = decoded as jwt.JwtPayload;
//         if (!user_id || !role) {
//           return res
//             .status(HTTP_statusCode.UNAUTHORIZED)
//             .json({ message: "Access denied. Token payload invalid." });
//         } else {
//           const newAccessToken = createAccessToken(user_id, role);
//           res.cookie("AccessToken", newAccessToken, {
//             httpOnly: true,
//             sameSite: "strict",
//             maxAge: 15 * 60 * 1000,
//           });
//           next();
//         }
//       }
//     });
//   } else {
//     return res
//       .status(HTTP_statusCode.UNAUTHORIZED)
//       .json({ message: "Access denied. Refresh token not provided." });
//   }
// };

export { createAccessToken, createRefreshToken };
