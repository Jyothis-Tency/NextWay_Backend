import { Request, Response } from "express";
import HttpStatusCode from "../Enums/httpStatusCodes";
import { ISeeker } from "../Interfaces/common_interface";
import { ISeekerServices } from "../Interfaces/seeker_service_interface";

class SeekerController {
  private seekerService: ISeekerServices;

  constructor(seekerService: ISeekerServices) {
    this.seekerService = seekerService;
  }

  loginSeeker = async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      const serviceResponse = await this.seekerService.loginSeeker(
        email,
        password
      );
      res.cookie("RefreshToken", serviceResponse.refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: "/",
      });
      res.cookie("AccessToken", serviceResponse.accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 15 * 60 * 1000,
        path: "/",
      });
      res
        .status(HttpStatusCode.OK)
        .json({ status: true, userData: serviceResponse.seekerData });
    } catch (error: any) {
      console.log(`Error in userLogin at userController : ${error}`);
      if (error.message === "email not found") {
        res
          .status(HttpStatusCode.NOT_FOUND)
          .json({ message: "email not found" });
      } else if (error.message === "wrong password") {
        res
          .status(HttpStatusCode.UNAUTHORIZED)
          .json({ message: "wrong password" });
      } else if (error.message === "seeker is blocked by admin") {
        res
          .status(HttpStatusCode.FORBIDDEN)
          .json({ message: "seeker is blocked by admin" });
      } else {
        res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
          message:
            "Something has went wrong. Please be calm and try again later.",
        });
      }
    }
  };

  registerSeeker = async (req: Request, res: Response) => {
    try {
      const userData: ISeeker = req.body;
      await this.seekerService.registerSeeker(userData);
      res.status(HttpStatusCode.OK).send("OTP send to mail successfully");
    } catch (error: any) {
      console.log(`Error in userRegister at userController : ${error}`);
      if (error.message === "email already exist") {
        res
          .status(HttpStatusCode.CONFLICT)
          .json({ message: "Email already exist" });
      } else if (error.message === "email not send") {
        res
          .status(HttpStatusCode.SERVICE_UNAVAILABLE)
          .json({ message: "Email not send" });
      } else {
        res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
          message:
            "Something has went wrong. Please be calm and try again later.",
        });
      }
    }
  };

  otpVerification = async (req: Request, res: Response) => {
    try {
      const receivedOTP: string = req.body.receivedOTP;
      const email: string = req.body.email;
      console.log(receivedOTP);
      await this.seekerService.otpVerification(email, receivedOTP);
      res.status(HttpStatusCode.OK).json({ message: "verified" });
    } catch (error: any) {
      console.log(`Error in otpVerification at userController : ${error}`);
      if (error.message === "incorrect OTP") {
        res
          .status(HttpStatusCode.UNAUTHORIZED)
          .json({ message: "incorrect OTP" });
      } else if (error.message === "OTP expired or doesn't exist") {
        res
          .status(HttpStatusCode.EXPIRED)
          .json({ message: "OTP expired or doesn't exist" });
      } else {
        res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
          message:
            "Something has went wrong. Please be calm and try again later.",
        });
      }
    }
  };

  resentOtp = async (req: Request, res: Response) => {
    try {
      const email: string = req.body.email;
      await this.seekerService.resentOtp(email);
      res
        .status(HttpStatusCode.OK)
        .json({ success: true, message: "OTP resend successfully" });
    } catch (error: any) {
      console.log(`Error in otpVerification at userController : ${error}`);
      if (error.message === "otp not resend") {
        res
          .status(HttpStatusCode.UNAUTHORIZED)
          .json({ message: "otp not resend" });
      } else {
        res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
          message:
            "Something has went wrong. Please be calm and try again later.",
        });
      }
    }
  };

  forgotPasswordEmail = async (req: Request, res: Response) => {
    try {
      const email = req.body.email;

      console.log(email);
      const result = await this.seekerService.forgotPasswordEmail(email);
      if (result) {
        res.status(HttpStatusCode.OK).json({ status: true });
      }
    } catch (error: any) {
      console.log(`Error in emailValidation at userController : ${error}`);
      if (error.message === "email not found") {
        res
          .status(HttpStatusCode.NOT_FOUND)
          .json({ message: "email not found" });
      } else {
        res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
          message:
            "Something has went wrong. Please be calm and try again later.",
        });
      }
    }
  };

  forgotPasswordOTP = async (req: Request, res: Response) => {
    try {
      const { email, otp } = req.body;
      const result = await this.seekerService.forgotPasswordOTP(email, otp);
      if (result) {
        res.status(HttpStatusCode.OK).json({ status: true });
      }
    } catch (error: any) {
      console.log(`Error in otpVerification at userController : ${error}`);
      if (error.message === "incorrect OTP") {
        res
          .status(HttpStatusCode.UNAUTHORIZED)
          .json({ message: "incorrect OTP" });
      } else if (error.message === "OTP expired or doesn't exist") {
        res
          .status(HttpStatusCode.EXPIRED)
          .json({ message: "OTP expired or doesn't exist" });
      } else {
        res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
          message:
            "Something has went wrong. Please be calm and try again later.",
        });
      }
    }
  };

  forgotPasswordReset = async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      const serviceResponse = await this.seekerService.forgotPasswordReset(
        email,
        password
      );
      if (serviceResponse) {
        res.status(HttpStatusCode.OK).json({ status: true });
      }
    } catch (error: any) {
      console.log(`Error in emailValidation at userController : ${error}`);
      if (error.message === "email not found") {
        res
          .status(HttpStatusCode.NOT_FOUND)
          .json({ message: "email not found" });
      } else {
        res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
          message:
            "Something has went wrong. Please be calm and try again later.",
        });
      }
    }
  };

  getAllJobPosts = async (req: Request, res: Response) => {
    try {
      const serviceResponse = await this.seekerService.getAllJobPosts();
      console.log("serviceResponse - ", serviceResponse);
      const { jobPosts, companies } = serviceResponse;
      if (serviceResponse) {
        res
          .status(HttpStatusCode.OK)
          .json({ status: true, jobPosts: jobPosts, companies: companies });
      }
    } catch (error: any) {
      console.log(
        `Error in getAllJobPostsController at userController : ${error}`
      );
      if (error.message === "email not found") {
        res
          .status(HttpStatusCode.NOT_FOUND)
          .json({ message: "email not found" });
      } else {
        res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
          message:
            "Something has went wrong. Please be calm and try again later.",
        });
      }
    }
  };

  getSeekerProfileController = async (req: Request, res: Response) => {
    try {
      const seeker_id = req.params.seeker_id;
      console.log(seeker_id);
      const { seekerProfile, imgBuffer } =
        await this.seekerService.getSeekerProfile(seeker_id);
      console.log(seekerProfile);
      let imageBase64 = null;
      if (imgBuffer) {
        imageBase64 = `data:image/jpeg;base64,${imgBuffer.toString("base64")}`;
      }
      res.status(HttpStatusCode.OK).json({
        status: true,
        seekerProfile: seekerProfile,
        image: imageBase64,
      });
    } catch (error: any) {
      console.log(
        `Error in getUserProfileController at userController : ${error}`
      );
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        message:
          "Something has went wrong. Please be calm and try again later.",
      });
    }
  };

  editSeekerDetails = async (req: Request, res: Response) => {
    try {
      console.log("Inside editSeekerDetails:");
      console.log("req.body:", req.body);
      console.log("req.file:", req.file);

      const seeker_id = req.params.seeker_id;
      const seekerData = req.body;
      console.log(seeker_id, seekerData);

      const result = await this.seekerService.editSeekerDetailsService(
        seeker_id,
        seekerData
      );
      if (result) {
        res.status(HttpStatusCode.OK).json({ status: true });
      }
    } catch (error: any) {
      console.log(`Error in editSeekerDetails at SeekerController : ${error}`);
      if (error.message === "seeker not updated") {
        res.status(HttpStatusCode.NOT_FOUND).json({ message: error.message });
      } else {
        res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
          message:
            "Something has gone wrong. Please be calm and try again later.",
        });
      }
    }
  };

  newJobApplication = async (req: Request, res: Response) => {
    try {
      console.log("Inside newJobApplication:");
      console.log("req.body:", req.body);
      console.log("req.file:", req.file);

      const applicationData = req.body;
      const resume = req.file;
      const result = await this.seekerService.newJobApplication(
        applicationData,
        resume
      );
      if (result) {
        res.status(HttpStatusCode.OK).json({ status: true });
      }
    } catch (error: any) {
      console.log(`Error in editSeekerDetails at SeekerController : ${error}`);
      if (error.message === "seeker not updated") {
        res.status(HttpStatusCode.NOT_FOUND).json({ message: error.message });
      } else {
        res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
          message:
            "Something has gone wrong. Please be calm and try again later.",
        });
      }
    }
  };
  updateProfileImgController = async (req: Request, res: Response) => {
    try {
      console.log("Inside updateProfileImg:");
      // console.log("req.body:", req.body);

      // const applicationData = req.body;
      const seeker_id = req.params.seeker_id;
      const img = req.file;
      console.log("seeker_id,img", seeker_id, img);

      const image = await this.seekerService.updateProfileImg(seeker_id, img);
      if (image) {
        res.status(HttpStatusCode.OK).json({ status: true });
      }
    } catch (error: any) {
      console.log(`Error in editSeekerDetails at SeekerController : ${error}`);
      if (error.message === "image not updated") {
        res.status(HttpStatusCode.NOT_FOUND).json({ message: error.message });
      } else {
        res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
          message:
            "Something has gone wrong. Please be calm and try again later.",
        });
      }
    }
  };
}

export default SeekerController;
