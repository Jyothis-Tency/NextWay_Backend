import { Request, Response, NextFunction } from "express";
import HttpStatusCode from "../Enums/httpStatusCodes";
import { IUser } from "../Interfaces/common_interface";
import { IUserServices } from "../Interfaces/user_service_interface";
import { ICompanyServices } from "../Interfaces/company_service_interface";
import { IAdminServices } from "../Interfaces/admin_service_interface";

class UserController {
  private userService: IUserServices;

  constructor(userService: IUserServices) {
    this.userService = userService;
  }

  /**
   * Handles user login by validating credentials
   * @param req Request containing email and password in body
   * @param res Response to return user data
   * @param next Next function for error handling
   */
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

  /**
   * Processes Google OAuth authentication
   * @param req Request containing Google credential in body
   * @param res Response to return authenticated user data
   * @param next Next function for error handling
   */
  handleGoogleAuth = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { credential } = req.body;
      const result = await this.userService.handleGoogleAuth(credential);
      res.status(HttpStatusCode.OK).json({
        message: "Google authentication successful",
        userData: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Registers a new user and sends verification OTP via email
   * @param req Request containing user registration data in body
   * @param res Response to confirm OTP sent
   * @param next Next function for error handling
   */
  registerUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userData: IUser = req.body;
      await this.userService.registerUser(userData);
      res.status(HttpStatusCode.OK).send("OTP send to mail successfully");
    } catch (error) {
      next(error);
    }
  };

  /**
   * Verifies user's email through OTP validation
   * @param req Request containing OTP and email in body
   * @param res Response to confirm verification status
   * @param next Next function for error handling
   */
  otpVerification = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { receivedOTP, email } = req.body;
      await this.userService.otpVerification(email, receivedOTP);
      res.status(HttpStatusCode.OK).json({ message: "verified" });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Resends OTP to user's email for verification
   * @param req Request containing email in body
   * @param res Response to confirm OTP resend
   * @param next Next function for error handling
   */
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

  /**
   * Initiates forgot password process by sending email
   * @param req Request containing user's email in body
   * @param res Response to confirm email sent
   * @param next Next function for error handling
   */
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

  /**
   * Validates OTP for forgot password process
   * @param req Request containing email and OTP in body
   * @param res Response to confirm OTP validation
   * @param next Next function for error handling
   */
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

  /**
   * Resets user's password after successful OTP verification
   * @param req Request containing email and new password in body
   * @param res Response to confirm password reset
   * @param next Next function for error handling
   */
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

  /**
   * Retrieves all job postings and associated company information
   * @param req Request object
   * @param res Response containing job posts and companies data
   * @param next Next function for error handling
   */
  getAllJobPosts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const serviceResponse = await this.userService.getAllJobPosts();
      const { jobPosts, companies } = serviceResponse;
      res.status(HttpStatusCode.OK).json({ status: true, jobPosts, companies });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Fetches user profile details including profile image
   * @param req Request containing user_id in params
   * @param res Response with user profile and base64 encoded image
   * @param next Next function for error handling
   */
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

  /**
   * Updates user profile information
   * @param req Request containing user_id in params and updated data in body
   * @param res Response with updated user details
   * @param next Next function for error handling
   */
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

  /**
   * Submits a new job application with resume
   * @param req Request containing application data and resume file
   * @param res Response to confirm application submission
   * @param next Next function for error handling
   */
  newJobApplication = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const applicationData = req.body;
      const resume: Express.Multer.File | undefined = req.file;
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

  /**
   * Updates user's profile image
   * @param req Request containing user_id in params and image file
   * @param res Response to confirm image update
   * @param next Next function for error handling
   */
  updateProfileImgController = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const user_id = req.params.user_id;
      const img: Express.Multer.File | undefined = req.file;
      const image = await this.userService.updateProfileImg(user_id, img);
      if (image) {
        res.status(HttpStatusCode.OK).json({ status: true });
      }
    } catch (error) {
      next(error);
    }
  };

  /**
   * Retrieves user's subscription payment history
   * @param req Request containing userId in params
   * @param res Response with subscription history
   * @param next Next function for error handling
   */
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

  /**
   * Fetches details of user's current subscription
   * @param req Request containing userId in params
   * @param res Response with current subscription details
   * @param next Next function for error handling
   */
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

  /**
   * Retrieves all job applications for a specific user
   * @param req Request containing user_id in params
   * @param res Response with user's job applications
   * @param next Next function for error handling
   */
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

  /**
   * Searches for companies based on query string
   * @param req Request containing search query in query params
   * @param res Response with matching companies
   * @param next Next function for error handling
   */
  searchCompany = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { query } = req.query;
      console.log(query);

      const companies = await this.userService.searchCompany(query as string);

      res.status(HttpStatusCode.OK).json(companies);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Retrieves profile images for all companies
   * @param req Request object
   * @param res Response with company profile images
   * @param next Next function for error handling
   */
  getAllCompanyProfileImages = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyImages = await this.userService.getAllCompanyProfileImages();
      res.status(HttpStatusCode.OK).json(companyImages);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Fetches comprehensive details for all companies
   * @param req Request object
   * @param res Response with all company details
   * @param next Next function for error handling
   */
  fetchAllCompanyDetails = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const companyData = await this.userService.fetchAllCompanyDetails();

      if (companyData) {
        res
          .status(HttpStatusCode.OK)
          .json({ status: true, companyData: companyData });
      }
    } catch (error) {
      next(error);
    }
  };

  /**
   * Retrieves details of a specific subscription plan
   * @param req Request containing plan_id in body
   * @param res Response with plan details
   * @param next Next function for error handling
   */
  getSubscriptionPlan = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const plan_id = req.body.plan_id;

      const result = await this.userService.getSubscriptionPlans(plan_id);

      if (result) {
        res.status(HttpStatusCode.OK).json({ planData: result });
      }
    } catch (error) {
      console.log(`Error in emailValidation at userController : ${error}`);
      next(error);
    }
  };

  /**
   * Fetches detailed information for a specific company
   * @param req Request containing company_id in params
   * @param res Response with company profile and image
   * @param next Next function for error handling
   */
  getCompanyDetails = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const company_id = req.params.company_id;
      const { companyProfile, imgBuffer } =
        await this.userService.getCompanyDetails(company_id);
      let imageBase64 = "";
      if (imgBuffer) {
        imageBase64 = `data:image/jpeg;base64,${imgBuffer.toString("base64")}`;
      }
      res.status(HttpStatusCode.OK).json({
        status: true,
        companyProfile,
        image: imageBase64,
      });
    } catch (error) {
      console.log("errorindsaafesfgd", error);

      next(error);
    }
  };
}

export default UserController;
