import { Request, Response } from "express";
import { IJobPost, ICompany } from "../Interfaces/common_interface";
import { ICompanyServices } from "../Interfaces/company_service_interface";
import HttpStatusCode from "../Enums/httpStatusCodes";

class CompanyController {
  private companyService: ICompanyServices;
  constructor(companyService: ICompanyServices) {
    this.companyService = companyService;
  }

  registerSeeker = async (req: Request, res: Response) => {
    try {
      const companyData: ICompany = req.body;
      await this.companyService.registerCompany(companyData);
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
      await this.companyService.otpVerification(email, receivedOTP);
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
      await this.companyService.resentOtp(email);
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

  loginSeeker = async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      const serviceResponse = await this.companyService.loginCompany(
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
        .json({ status: true, userData: serviceResponse.companyData });
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
      } else if (error.message === "company is blocked by admin") {
        res
          .status(HttpStatusCode.FORBIDDEN)
          .json({ message: "company is blocked by admin" });
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
      const result = await this.companyService.forgotPasswordEmail(email);
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
      const result = await this.companyService.forgotPasswordOTP(email, otp);
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
      const serviceResponse = await this.companyService.forgotPasswordReset(
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

  getCompanyDetails = async (req: Request, res: Response) => {
    try {
      const company_id = req.params.company_id;
      const companyData = await this.companyService.getCompanyDetails(
        company_id
      );
      if (companyData) {
        res
          .status(HttpStatusCode.OK)
          .json({ status: true, companyData: companyData });
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

  editCompanyDetails = async (req: Request, res: Response) => {
    try {
      console.log("editCompanyDetails");
      console.log(req.body);

      const company_id = req.params.company_id;
      const companyData = req.body;
      console.log(company_id, companyData);

      const result = await this.companyService.editCompanyDetails(
        company_id,
        companyData
      );
      if (result) {
        res.status(HttpStatusCode.OK).json({ status: true });
      }
    } catch (error: any) {
      console.log(`Error in emailValidation at userController : ${error}`);
      if (error.message === "company not updated") {
        res.status(HttpStatusCode.NOT_FOUND).json({ message: error.message });
      } else {
        res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
          message:
            "Something has went wrong. Please be calm and try again later.",
        });
      }
    }
  };

  createOrUpdateJobPost = async (req: Request, res: Response) => {
    try {
      console.log("createNewJobPost");
      console.log(req.body);

      const jobPostData = req.body;

      const result = await this.companyService.createOrUpdateJobPost(
        jobPostData
      );
      if (result) {
        res.status(HttpStatusCode.OK).json({ status: true });
      }
    } catch (error: any) {
      console.log(`Error in emailValidation at userController : ${error}`);
      if (
        error.message ===
        "error occurred while creating or updating the job post"
      ) {
        res.status(HttpStatusCode.CONFLICT).json({ message: error.message });
      } else {
        res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
          message:
            "Something has went wrong. Please be calm and try again later.",
        });
      }
    }
  };

  jobPostsByCompany = async (req: Request, res: Response) => {
    try {
      console.log("jobPostsByCompany");

      const company_id = req.params.company_id;

      const result = await this.companyService.jobPostsByCompanyId(company_id);
      if (result) {
        res.status(HttpStatusCode.OK).json({ status: true, jobPosts: result });
      }
    } catch (error: any) {
      console.log(`Error in jobPostsByCompany at companyController : ${error}`);
      if (error.message === "Jobs not found for the specified company") {
        res.status(HttpStatusCode.CONFLICT).json({ message: error.message });
      } else {
        res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
          message:
            "Something has went wrong. Please be calm and try again later.",
        });
      }
    }
  };

  getJobPostByJobId = async (req: Request, res: Response) => {
    try {
      console.log("getJobPostByJobId");

      const _id = req.params.job_id;

      const result = await this.companyService.getJobPostByJobId(_id);
      console.log("result - ", result);

      if (result) {
        res.status(HttpStatusCode.OK).json({ status: true, jobPost: result });
      }
    } catch (error: any) {
      console.log(`Error in jobPostsByCompany at companyController : ${error}`);
      if (error.message === "job is not fount") {
        res.status(HttpStatusCode.CONFLICT).json({ message: error.message });
      } else {
        res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
          message:
            "Something has went wrong. Please be calm and try again later.",
        });
      }
    }
  };

  deleteJobPostById = async (req: Request, res: Response) => {
    try {
      console.log("getJobPostByJobId");

      const _id = req.params.job_id;

      const result = await this.companyService.deleteJobPostById(_id);
      console.log("result - ", result);

      if (result) {
        res.status(HttpStatusCode.OK).json({ status: true });
      }
    } catch (error: any) {
      console.log(`Error in jobPostsByCompany at companyController : ${error}`);
      if (error.message === "job post not deleted") {
        res.status(HttpStatusCode.CONFLICT).json({ message: error.message });
      } else {
        res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
          message:
            "Something has went wrong. Please be calm and try again later.",
        });
      }
    }
  };

  getJobApplicationsByCompanyId = async (req: Request, res: Response) => {
    try {
      console.log("getJobApplicationsByCompanyId");

      const _id = req.params.company_id;

      const result = await this.companyService.getJobApplicationsByCompanyId(
        _id
      );
      console.log("result - ", result);

      if (result) {
        res
          .status(HttpStatusCode.OK)
          .json({ status: true, jobApplications: result });
      }
    } catch (error: any) {
      console.log(`Error in jobPostsByCompany at companyController : ${error}`);
      if (error.message === "there is no job application in this company") {
        res.status(HttpStatusCode.CONFLICT).json({ message: error.message });
      } else {
        res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
          message:
            "Something has went wrong. Please be calm and try again later.",
        });
      }
    }
  };
}

export default CompanyController;
