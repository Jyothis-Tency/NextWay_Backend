import { Router } from "express";
import Company from "../Models/companyModel";
import CompanyController from "../Controllers/companyController";
import CompanyServices from "../Services/companyService";
import CompanyRepository from "../Repository/companyRepository";
import JobPost from "../Models/jobPostModel";
import companyAuth from "../Middleware/companyAuth";
import JobApplication from "../Models/jobApplicationModel";
import { upload } from "../Config/multerConfig";
import AdminRepository from "../Repository/adminRepository";
import User from "../Models/userModel";
import SubscriptionPlan from "../Models/subscriptionPlanModel";
import SubscriptionDetails from "../Models/subscriptionDetails";
import SubscriptionHistory from "../Models/SubscriptionHistory";
import UserRepository from "../Repository/userRepository";

const companyRepository = new CompanyRepository(
  Company,
  JobPost,
  JobApplication
);
const userRepository = new UserRepository(
  User,
  Company,
  JobApplication,
  SubscriptionDetails,
  SubscriptionPlan,
  JobPost,
  SubscriptionHistory
);
const adminRepository = new AdminRepository(Company, User, SubscriptionPlan);
const companyService = new CompanyServices(
  companyRepository,
  adminRepository,
  userRepository
);
const companyController = new CompanyController(companyService);

const companyRoutes = Router();

companyRoutes
  .post("/register", companyController.registerUser)
  .post("/verify-otp", companyController.otpVerification)
  .post("/resent-otp", companyController.resentOtp)
  .post("/login", companyController.loginUser)
  .post("/forgot-password-email", companyController.forgotPasswordEmail)
  .post("/forgot-password-OTP", companyController.forgotPasswordOTP)
  .post("/forgot-password-reset", companyController.forgotPasswordReset)
  .get(
    "/get-company/:company_id",

    companyController.getCompanyDetails
  )
  .put(
    "/edit-company/:company_id",

    companyController.editCompanyDetails
  )
  .put(
    "/create-update-job-post",

    companyController.createOrUpdateJobPost
  )
  .get(
    "/get-company-jobs/:company_id",

    companyController.jobPostsByCompany
  )
  .get(
    "/get-job-post/:job_id",

    companyController.getJobPostByJobId
  )
  .delete(
    "/delete-job-post/:job_id",

    companyController.deleteJobPostById
  )
  .get(
    "/job-applications/:company_id",

    companyController.getJobApplicationsByCompanyId
  )
  .post(
    "/upload-profile-img/:company_id",

    upload.single("profilePicture"),
    companyController.updateProfileImgController
  )

  .get(
    "/job-applications-post/:jobId",
    companyController.getJobApplicationsByJobId
  )
  .put(
    "/update-application-status/:applicationId",
    companyController.updateApplicationStatus
  )

  .get(
    "/job-applications-detailed/:applicationId",

    companyController.getJobApplicationById
  )
  .get("/search/users", companyController.searchUser)
  .put(
    "/set-interview-details/:applicationId",
    companyController.setInterviewDetails
  )
  .get("/getAllUserProfileImages", companyController.getAllUserProfileImages)
  .get(
    "/user-profile/:user_id",

    companyController.getUserProfileController
  );

// companyRoutes.post("/createPost", companyController.newJobPosted);
// companyRoutes.post("/createCompany", companyController.newCompanyCreated);
// companyRoutes.get(
//   "/companyDetails/:userId",
//   companyController.getCompanyDetails
// );

export default companyRoutes;
