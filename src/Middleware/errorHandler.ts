import { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import CustomError from "../Utils/customError";
import HttpStatusCode from "../Enums/httpStatusCodes";

const errorHandler: ErrorRequestHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
    console.log("errorHandling");
    
  console.error(err.stack);

  if (err instanceof CustomError) {
    res.status(err.statusCode).json({ message: err.message });
    return;
  }

  // Default to 500 for unknown errors
  res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
    message: "Something went wrong. Please try again later.",
  });
};

export default errorHandler;
