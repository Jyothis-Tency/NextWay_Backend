import { Request, Response, NextFunction } from "express";
import {
  IJobPost,
  ICompany,
  IJobApplication,
} from "../Interfaces/common_interface";
import { ICompanyServices } from "../Interfaces/company_service_interface";
import HttpStatusCode from "../Enums/httpStatusCodes";
import { log } from "console";

class CompanyController {
  private companyService: ICompanyServices;
  constructor(companyService: ICompanyServices) {
    this.companyService = companyService;
  }

  /**
   * Registers a new company with uploaded certificate
   * @param req Request containing company registration data and certificate file
   * @param res Response to confirm OTP sent
   * @param next Next function for error handling
   */
  registerUser = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyData: ICompany = req.body;
      const certificate: Express.Multer.File | undefined = req.file;
      await this.companyService.registerCompany(companyData, certificate);
      res.status(HttpStatusCode.OK).send("OTP send to mail successfully");
    } catch (error: unknown) {
      next(error);
    }
  };

  /**
   * Verifies company's email through OTP validation
   * @param req Request containing OTP and email in body
   * @param res Response to confirm verification status
   * @param next Next function for error handling
   */
  otpVerification = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { receivedOTP, email } = req.body;

      await this.companyService.otpVerification(email, receivedOTP);
      res.status(HttpStatusCode.OK).json({ message: "verified" });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Resends OTP to company's email for verification
   * @param req Request containing email in body
   * @param res Response to confirm OTP resend
   * @param next Next function for error handling
   */
  resentOtp = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { email } = req.body;
      await this.companyService.resentOtp(email);
      res.status(HttpStatusCode.OK).json({
        success: true,
        message: "OTP resend successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Handles company login by validating credentials and setting authentication cookies
   * @param req Request containing email and password in body
   * @param res Response to set auth cookies and return company data
   * @param next Next function for error handling
   */
  loginUser = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { email, password } = req.body;
      const serviceResponse = await this.companyService.loginCompany(
        email,
        password
      );

      res
        .status(HttpStatusCode.OK)
        .json({ status: true, userData: serviceResponse.companyData });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Initiates forgot password process by sending email
   * @param req Request containing company's email in body
   * @param res Response to confirm email sent
   * @param next Next function for error handling
   */
  forgotPasswordEmail = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { email } = req.body;
      const result = await this.companyService.forgotPasswordEmail(email);
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
  ): Promise<void> => {
    try {
      const { email, otp } = req.body;
      const result = await this.companyService.forgotPasswordOTP(email, otp);
      if (result) {
        res.status(HttpStatusCode.OK).json({ status: true });
      }
    } catch (error) {
      next(error);
    }
  };

  /**
   * Resets company's password after successful OTP verification
   * @param req Request containing email and new password in body
   * @param res Response to confirm password reset
   * @param next Next function for error handling
   */
  forgotPasswordReset = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { email, password } = req.body;
      const serviceResponse = await this.companyService.forgotPasswordReset(
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
   * Fetches detailed information for a specific company
   * @param req Request containing company_id in params
   * @param res Response with company profile and base64 encoded image
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
        await this.companyService.getCompanyDetails(company_id);
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
      next(error);
    }
  };

  /**
   * Updates company profile information
   * @param req Request containing company_id in params and updated data in body
   * @param res Response to confirm update
   * @param next Next function for error handling
   */
  editCompanyDetails = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const company_id = req.params.company_id;
      const companyData = req.body;
      const result = await this.companyService.editCompanyDetails(
        company_id,
        companyData
      );
      if (result) {
        res.status(HttpStatusCode.OK).json({ status: true });
      }
    } catch (error) {
      next(error);
    }
  };

  /**
   * Creates or updates a job posting
   * @param req Request containing job post data in body
   * @param res Response to confirm creation/update
   * @param next Next function for error handling
   */
  createOrUpdateJobPost = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const jobPostData = req.body;
      const result = await this.companyService.createOrUpdateJobPost(
        jobPostData
      );
      if (result) {
        res.status(HttpStatusCode.OK).json({ status: true });
      }
    } catch (error) {
      next(error);
    }
  };

  /**
   * Retrieves all job posts for a specific company
   * @param req Request containing company_id in params
   * @param res Response with company's job posts
   * @param next Next function for error handling
   */
  jobPostsByCompany = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const company_id = req.params.company_id;
      const result = await this.companyService.jobPostsByCompanyId(company_id);
      if (result) {
        res.status(HttpStatusCode.OK).json({ status: true, jobPosts: result });
      }
    } catch (error) {
      next(error);
    }
  };

  /**
   * Fetches details of a specific job post
   * @param req Request containing job_id in params
   * @param res Response with job post details
   * @param next Next function for error handling
   */
  getJobPostByJobId = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const _id = req.params.job_id;
      const result = await this.companyService.getJobPostByJobId(_id);
      if (result) {
        res.status(HttpStatusCode.OK).json({ status: true, jobPost: result });
      }
    } catch (error) {
      next(error);
    }
  };

  /**
   * Deletes a specific job post
   * @param req Request containing job_id in params
   * @param res Response to confirm deletion
   * @param next Next function for error handling
   */
  deleteJobPostById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const _id = req.params.job_id;
      const result = await this.companyService.deleteJobPostById(_id);
      if (result) {
        res.status(HttpStatusCode.OK).json({ status: true });
      }
    } catch (error) {
      next(error);
    }
  };

  /**
   * Retrieves all job applications for a specific company
   * @param req Request containing company_id in params
   * @param res Response with company's job applications
   * @param next Next function for error handling
   */
  getJobApplicationsByCompanyId = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const _id = req.params.company_id;
      const result = await this.companyService.getJobApplicationsByCompanyId(
        _id
      );
      if (result) {
        res
          .status(HttpStatusCode.OK)
          .json({ status: true, jobApplications: result });
      }
    } catch (error) {
      next(error);
    }
  };

  /**
   * Updates company's profile image
   * @param req Request containing company_id in params and image file
   * @param res Response to confirm image update
   * @param next Next function for error handling
   */
  updateProfileImgController = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const company_id = req.params.company_id;
      const img: Express.Multer.File | undefined = req.file;
      const image = await this.companyService.updateProfileImg(company_id, img);
      if (image) {
        res.status(HttpStatusCode.OK).json({ status: true });
      }
    } catch (error) {
      next(error);
    }
  };

  /**
   * Retrieves all job applications for a specific job posting
   * @param req Request containing jobId in params
   * @param res Response with job applications
   * @param next Next function for error handling
   */
  getJobApplicationsByJobId = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const jobId = req.params.jobId;
      const jobApplications =
        await this.companyService.getJobApplicationsByJobId(jobId);
      res.status(HttpStatusCode.OK).json({ status: true, jobApplications });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Updates the status of a job application
   * @param req Request containing applicationId in params, status and message in body, and optional offer letter file
   * @param res Response to confirm status update
   * @param next Next function for error handling
   */
  updateApplicationStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { applicationId } = req.params;
      const { status, statusMessage } = req.body;
      const offerLetter: Express.Multer.File | undefined = req.file;
      await this.companyService.updateApplicationStatus(
        applicationId,
        status,
        statusMessage,
        offerLetter
      );
      res.status(HttpStatusCode.OK).json({
        status: true,
        message: "Application status updated successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Fetches details of a specific job application
   * @param req Request containing applicationId in params
   * @param res Response with application details
   * @param next Next function for error handling
   */
  getJobApplicationById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { applicationId } = req.params;
      const application = await this.companyService.getJobApplicationById(
        applicationId
      );
      if (!application) {
        res
          .status(HttpStatusCode.NOT_FOUND)
          .json({ message: "Application not found" });
      }
      res.status(HttpStatusCode.OK).json({ status: true, application });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Searches for users based on query string
   * @param req Request containing search query in query params
   * @param res Response with matching users
   * @param next Next function for error handling
   */
  searchUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { query } = req.query;
      const users = await this.companyService.searchUser(query as string);
      res.status(HttpStatusCode.OK).json(users);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Sets or updates interview details for a job application
   * @param req Request containing applicationId in params and interview details in body
   * @param res Response to confirm interview details update
   * @param next Next function for error handling
   */
  setInterviewDetails = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { applicationId } = req.params;
      const { interviewStatus, dateTime, message } = req.body;
      const interviewDetails = { interviewStatus, dateTime, message };
      await this.companyService.setInterviewDetails(
        applicationId,
        interviewDetails
      );
      res.status(HttpStatusCode.OK).json({
        status: true,
        message: "Interview details updated successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Retrieves profile images for all users
   * @param req Request object
   * @param res Response with user profile images
   * @param next Next function for error handling
   */
  getAllUserProfileImages = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userImages = await this.companyService.getAllUserProfileImages();
      res.status(HttpStatusCode.OK).json(userImages);
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
      const { userProfile, imgBuffer } =
        await this.companyService.getUserProfile(user_id);
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
}

export default CompanyController;
