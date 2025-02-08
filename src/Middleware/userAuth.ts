import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import HttpStatusCode from "../Enums/httpStatusCodes";
import User from "../Models/userModel";

const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_TOKEN_SECRET as string;

async function userAuth(req: Request, res: Response, next: NextFunction) {
  try {
    console.log("userAuth triggered");
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res
        .status(HttpStatusCode.UNAUTHORIZED)
        .json({ message: "Access token required" });
    }

    const token = authHeader?.split(" ")[1];

    if (!token) {
      res
        .status(HttpStatusCode.UNAUTHORIZED)
        .json({ message: "Token is missing" });
      return;
    }

    jwt.verify(token, ACCESS_TOKEN_SECRET, async (err, decode) => {
      if (err) {
        res
          .status(HttpStatusCode.UNAUTHORIZED)
          .json({ message: "Invalid token" });
        return;
      }

      const { user_id } = decode as jwt.JwtPayload;
      const user = await User.findById(user_id);

      if (!user) {
        res
          .status(HttpStatusCode.UNAUTHORIZED)
          .json({ message: "User not found" });
        return
      }

      if (user?.role !== "user") {
        res
          .status(HttpStatusCode.UNAUTHORIZED)
          .json({ message: "Not Authorized for your current role" });
      }
    });

    const user_id = req.headers["user_id"];

    if (user_id) {
      const user = await User.findOne({ user_id: user_id });

      if (user?.isBlocked === true) {
        res.status(HttpStatusCode.FORBIDDEN).json("user blocked");
        return;
      }
    }
    next();
  } catch (error) {
    res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json("server error");
  }
}

export default userAuth;
