import HttpStatusCode from "../Enums/httpStatusCodes";

class CustomError extends Error {
  public statusCode: number;

  constructor(
    message: string,
    statusCode: number = HttpStatusCode.INTERNAL_SERVER_ERROR
  ) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export default CustomError;
