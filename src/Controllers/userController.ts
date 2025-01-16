import { Request, Response, NextFunction } from "express";
import HttpStatusCode from "../Enums/httpStatusCodes";
import { IUser } from "../Interfaces/common_interface";
import { IUserServices } from "../Interfaces/user_service_interface";

class UserController {
  private userService: IUserServices;

  constructor(userService: IUserServices) {
    this.userService = userService;
  }

  loginUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;
      const serviceResponse = await this.userService.loginUser(email, password);
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
        .json({ status: true, userData: serviceResponse.userData });
    } catch (error) {
      next(error);
    }
  };

  registerUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userData: IUser = req.body;
      await this.userService.registerUser(userData);
      res.status(HttpStatusCode.OK).send("OTP send to mail successfully");
    } catch (error) {
      next(error);
    }
  };

  otpVerification = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { receivedOTP, email } = req.body;
      await this.userService.otpVerification(email, receivedOTP);
      res.status(HttpStatusCode.OK).json({ message: "verified" });
    } catch (error) {
      next(error);
    }
  };

  resentOtp = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email } = req.body;
      await this.userService.resentOtp(email);
      res
        .status(HttpStatusCode.OK)
        .json({ success: true, message: "OTP resend successfully" });
    } catch (error) {
      next(error);
    }
  };

  forgotPasswordEmail = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { email } = req.body;
      const result = await this.userService.forgotPasswordEmail(email);
      if (result) {
        res.status(HttpStatusCode.OK).json({ status: true });
      }
    } catch (error) {
      next(error);
    }
  };

  forgotPasswordOTP = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { email, otp } = req.body;
      const result = await this.userService.forgotPasswordOTP(email, otp);
      if (result) {
        res.status(HttpStatusCode.OK).json({ status: true });
      }
    } catch (error) {
      next(error);
    }
  };

  forgotPasswordReset = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { email, password } = req.body;
      const serviceResponse = await this.userService.forgotPasswordReset(
        email,
        password
      );
      if (serviceResponse) {
        res.status(HttpStatusCode.OK).json({ status: true });
      }
    } catch (error) {
      next(error);
    }
  };

  getAllJobPosts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const serviceResponse = await this.userService.getAllJobPosts();
      const { jobPosts, companies } = serviceResponse;
      res.status(HttpStatusCode.OK).json({ status: true, jobPosts, companies });
    } catch (error) {
      next(error);
    }
  };

  getUserProfileController = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const user_id = req.params.user_id;
      const { userProfile, imgBuffer } = await this.userService.getUserProfile(
        user_id
      );
      let imageBase64 = "";
      if (imgBuffer) {
        imageBase64 = `data:image/jpeg;base64,${imgBuffer.toString("base64")}`;
      }
      res.status(HttpStatusCode.OK).json({
        status: true,
        userProfile,
        image: imageBase64,
      });
    } catch (error) {
      next(error);
    }
  };

  editUserDetails = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user_id = req.params.user_id;
      const userData = req.body;
      const result = await this.userService.editUserDetailsService(
        user_id,
        userData
      );
      if (result) {
        res.status(HttpStatusCode.OK).json(result);
      }
    } catch (error) {
      next(error);
    }
  };

  newJobApplication = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const applicationData = req.body;
      const resume = req.file;
      applicationData.companyName = req.body.companyName;
      applicationData.jobTitle = req.body.jobTitle;
      const result = await this.userService.newJobApplication(
        applicationData,
        resume
      );
      if (result) {
        res.status(HttpStatusCode.OK).json({ status: true });
      }
    } catch (error) {
      next(error);
    }
  };

  updateProfileImgController = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const user_id = req.params.user_id;
      const img = req.file;
      const image = await this.userService.updateProfileImg(user_id, img);
      if (image) {
        res.status(HttpStatusCode.OK).json({ status: true });
      }
    } catch (error) {
      next(error);
    }
  };

  createOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { planId, userId } = req.body;
      const order = await this.userService.createOrder(planId, userId);
      if (order) {
        res.status(HttpStatusCode.OK).json({ order });
      }
    } catch (error) {
      next(error);
    }
  };

  verifyPayment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log("verifyPayment");

      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        planId,
        userId,
      } = req.body;
      console.log(
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        planId,
        userId
      );
      const subscription = await this.userService.verifyPayment(
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        userId,
        planId
      );
      if (subscription) {
        res
          .status(HttpStatusCode.OK)
          .json({ success: true, data: subscription });
      }
    } catch (error) {
      next(error);
    }
  };

  getSubscriptionHistory = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const user_id = req.params.userId;
      const history = await this.userService.getSubscriptionHistory(user_id);
      if (history) {
        res.status(HttpStatusCode.OK).json({ history });
      }
    } catch (error) {
      next(error);
    }
  };

  getCurrentSubscriptionDetail = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const user_id = req.params.userId;
      const current = await this.userService.getCurrentSubscriptionDetail(
        user_id
      );
      if (current) {
        res.status(HttpStatusCode.OK).json({ current });
      }
    } catch (error) {
      next(error);
    }
  };

  getJobApplicationsByUserId = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const user_id = req.params.user_id;
      const applications = await this.userService.getJobApplicationsByUserId(
        user_id
      );
      res.status(HttpStatusCode.OK).json({ status: true, applications });
    } catch (error) {
      next(error);
    }
  };

  searchUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { query } = req.query;
      const users = await this.userService.searchUser(query as string);
      res.status(HttpStatusCode.OK).json(users);
    } catch (error) {
      next(error);
    }
  };
}

export default UserController;
