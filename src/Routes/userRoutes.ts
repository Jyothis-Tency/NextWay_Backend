import { Router } from "express";
import UserController from "../Controllers/userController";
import UserServices from "../Services/userServices";
import UserRepository from "../Repository/userRepository";
import User from "../Models/userModel";
import Company from "../Models/companyModel";
import JobPost from "../Models/jobPostModel";
import SubscriptionHistory from "../Models/SubscriptionHistory";
import CompanyRepository from "../Repository/companyRepository";
import JobApplication from "../Models/jobApplicationModel";
import { upload } from "../Config/multerConfig";
import SubscriptionDetails from "../Models/subscriptionDetails";
import SubscriptionPlan from "../Models/subscriptionPlanModel";
import { getSocketInstance } from "../Config/socketConfig";
import AdminRepository from "../Repository/adminRepository";

const userRepository = new UserRepository(
  User,
  Company,
  JobApplication,
  SubscriptionDetails,
  SubscriptionPlan,
  JobPost,
  SubscriptionHistory
);
const companyRepository = new CompanyRepository(
  Company,
  JobPost,
  JobApplication
);

const adminRepository = new AdminRepository(Company, User, SubscriptionPlan);

const userService = new UserServices(
  userRepository,
  companyRepository,
  adminRepository,
  getSocketInstance()
);
const userController = new UserController(userService);

const userRoutes = Router();

userRoutes
  .post("/register", userController.registerUser)
  .post("/verify-otp", userController.otpVerification)
  .post("/resent-otp", userController.resentOtp)
  .post("/login", userController.loginUser)
  .post("/forgot-password-email", userController.forgotPasswordEmail)
  .post("/forgot-password-OTP", userController.forgotPasswordOTP)
  .post("/forgot-password-reset", userController.forgotPasswordReset)
  .get("/getAllJobPosts", userController.getAllJobPosts)
  .get(
    "/user-profile/:user_id",

    userController.getUserProfileController
  )
  .put("/edit-user/:user_id", userController.editUserDetails)
  .post(
    "/post-job-application",

    upload.single("resume"),
    userController.newJobApplication
  )
  .post(
    "/upload-profile-picture/:user_id",

    upload.single("profilePicture"),
    userController.updateProfileImgController
  )
  .get(`/subscription-history/:userId`, userController.getSubscriptionHistory)
  .get(
    `/current-subscription/:userId`,
    userController.getCurrentSubscriptionDetail
  )
  .get(
    "/job-applications/:user_id",

    userController.getJobApplicationsByUserId
  )
  .get("/search/companies", userController.searchCompany)
  .get("/getAllCompanyProfileImages", userController.getAllCompanyProfileImages)
  .get("/all-companies", userController.fetchAllCompanyDetails)
  .get("/get-subscription-plan", userController.getSubscriptionPlan);
  

export default userRoutes;
