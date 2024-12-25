import { Router } from "express";
import Company from "../Models/companyModel";
import CompanyController from "../Controllers/companyController";
import CompanyServices from "../Services/companyService";
import CompanyRepository from "../Repository/companyRepository";
import JobPost from "../Models/jobPostModel";
import companyAuth from "../Config/companyAuth";
import JobApplication from "../Models/jobApplicationModel";
import { upload } from "../Config/multerConfig";

const companyRepository = new CompanyRepository(
  Company,
  JobPost,
  JobApplication
);
const companyService = new CompanyServices(companyRepository);
const companyController = new CompanyController(companyService);

const companyRoutes = Router();

companyRoutes.post("/register", companyController.registerUser);
companyRoutes.post("/verify-otp", companyController.otpVerification);
companyRoutes.post("/resent-otp", companyController.resentOtp);
companyRoutes.post("/login", companyController.loginUser);
companyRoutes.post(
  "/forgot-password-email",
  companyController.forgotPasswordEmail
);
companyRoutes.post("/forgot-password-OTP", companyController.forgotPasswordOTP);
companyRoutes.post(
  "/forgot-password-reset",
  companyController.forgotPasswordReset
);
companyRoutes.get(
  "/get-company/:company_id",
  companyAuth,
  companyController.getCompanyDetails
);
companyRoutes.put(
  "/edit-company/:company_id",
  companyAuth,
  companyController.editCompanyDetails
);
companyRoutes.put(
  "/create-update-job-post",
  companyAuth,
  companyController.createOrUpdateJobPost
);
companyRoutes.get(
  "/get-company-jobs/:company_id",
  companyAuth,
  companyController.jobPostsByCompany
);
companyRoutes.get(
  "/get-job-post/:job_id",
  companyAuth,
  companyController.getJobPostByJobId
);
companyRoutes.delete(
  "/delete-job-post/:job_id",
  companyAuth,
  companyController.deleteJobPostById
);
companyRoutes.get(
  "/job-applications/:company_id",
  companyAuth,
  companyController.getJobApplicationsByCompanyId
);
companyRoutes.post(
  "/upload-profile-img/:company_id",
  companyAuth,
  upload.single("profilePicture"),
  companyController.updateProfileImgController
);


// companyRoutes.post("/createPost", companyController.newJobPosted);
// companyRoutes.post("/createCompany", companyController.newCompanyCreated);
// companyRoutes.get(
//   "/companyDetails/:userId",
//   companyController.getCompanyDetails
// );

export default companyRoutes;
