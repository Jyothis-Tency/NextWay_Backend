import { Request, Response, NextFunction } from "express";
import HttpStatusCode from "../Enums/httpStatusCodes";
import User from "../Models/userModel";

async function userAuth(req: Request, res: Response, next: NextFunction) {
  try {
    console.log("userAuth triggered");

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
