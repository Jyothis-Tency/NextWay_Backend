import { Request, Response, NextFunction } from "express";
import HttpStatusCode from "../Enums/httpStatusCodes";
import Seeker from "../Models/seekerModel";

async function userAuth(req: Request, res: Response, next: NextFunction) {
  try {
    console.log("userAuth triggered");

    const seeker_id = req.headers["seeker_id"];

    if (seeker_id) {
      const seeker = await Seeker.findOne({ seeker_id: seeker_id });

      if (seeker?.isBlocked === true) {
        res.status(HttpStatusCode.FORBIDDEN).json("seeker blocked");
        return;
      }
    }
    next();
  } catch (error) {
    res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json("server error");
  }
}

export default userAuth;
