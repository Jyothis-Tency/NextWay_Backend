import { OAuth2Client } from "google-auth-library";
import dotenv from "dotenv";
import CustomError from "./customError";
import HttpStatusCode from "../Enums/httpStatusCodes";
dotenv.config();
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

const client: OAuth2Client = new OAuth2Client(GOOGLE_CLIENT_ID);

export const verifyGoogleToken = async (token: string) => {
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: GOOGLE_CLIENT_ID,
    });
    return ticket.getPayload();
  } catch (error) {
    throw new CustomError(
      "Google token verification failed",
      HttpStatusCode.NOT_FOUND
    );
  }
};
