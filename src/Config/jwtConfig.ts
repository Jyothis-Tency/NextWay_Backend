import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import HTTP_statusCode from "../Enums/httpStatusCodes";

dotenv.config();

const secret_key = process.env.JWT_KEY as string;

const createToken = (user_id: string, role: string): string => {
  return jwt.sign({ user_id, role }, secret_key, { expiresIn: "30m" });
};

const createRefreshToken = (user_id: string, role: string): string => {
  return jwt.sign({ user_id, role }, secret_key, { expiresIn: "7d" });
};

const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const accessToken: string = req.cookies.AccessToken;
    if (accessToken) {
      jwt.verify(accessToken, secret_key, async (err, decoded) => {
        if (err) {
          await handleRefreshToken(req, res, next);
        } else {
          const { role } = decoded as jwt.JwtPayload;
          if (role !== "user") {
            return res
              .status(HTTP_statusCode.UNAUTHORIZED)
              .json({ message: "Access denied. Insufficient role." });
          }
          next();
        }
      });
    } else {
      await handleRefreshToken(req, res, next);
    }
  } catch (error) {
    res
      .status(HTTP_statusCode.UNAUTHORIZED)
      .json({ message: "Access denied. Access token not valid." });
  }
};

const handleRefreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const refreshToken: string = req.cookies.RefreshToken;
  if (refreshToken) {
    jwt.verify(refreshToken, secret_key, (err, decoded) => {
      if (err) {
        return res
          .status(HTTP_statusCode.UNAUTHORIZED)
          .json({ message: "Access denied. Refresh token not valid." });
      } else {
        const { user_id, role } = decoded as jwt.JwtPayload;
        if (!user_id || !role) {
          return res
            .status(HTTP_statusCode.UNAUTHORIZED)
            .json({ message: "Access denied. Token payload invalid." });
        } else {
          const newAccessToken = createToken(user_id, role);
          res.cookie("AccessToken", newAccessToken, {
            httpOnly: true,
            sameSite: "strict",
            maxAge: 15 * 60 * 1000,
          });
          next();
        }
      }
    });
  } else {
    return res
      .status(HTTP_statusCode.UNAUTHORIZED)
      .json({ message: "Access denied. Refresh token not provided." });
  }
};

export { createToken, verifyToken, createRefreshToken };
