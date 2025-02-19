import redisClient from "./redisUtils";
import sendOTPasMail from "../Config/OTP_Config";
import CustomError from "./customError";
import HttpStatusCode from "../Enums/httpStatusCodes";

const otpSender = async (email: string): Promise<boolean> => {
  try {
    const generated_OTP: string = Math.floor(
      1000 + Math.random() * 9000
    ).toString();

    await redisClient.setEx(`${email}:otp`, 60, generated_OTP);
    const isMailSend = await sendOTPasMail(email, generated_OTP);
    if (!isMailSend) {
      throw new Error("email not send");
    }
    return true;
  } catch (error: unknown) {
    if (error instanceof CustomError) throw error;
    throw new CustomError(
      `Error in otpUtils otpSender: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      HttpStatusCode.INTERNAL_SERVER_ERROR
    );
  }
};

export default otpSender;
