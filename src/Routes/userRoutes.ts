import { Router } from "express";
import UserController from "../Controllers/userController";
import UserServices from "../Services/userServices";
import UserRepository from "../Repository/userRepository";
import User from "../Models/userModel";
import Company from "../Models/companyModel";
import JobPost from "../Models/jobPostModel";
import CompanyRepository from "../Repository/companyRepository";
import userAuth from "../Config/userAuth";
import JobApplication from "../Models/jobApplicationModel";
import { upload } from "../Config/multerConfig";
import SubscriptionDetails from "../Models/subscriptionDetails";
import SubscriptionPlan from "../Models/subscriptionPlanModel";
import { getSocketInstance } from "../Config/socketConfig";

const userRepository = new UserRepository(
  User,
  Company,
  JobApplication,
  SubscriptionDetails,
  SubscriptionPlan
);
const companyRepository = new CompanyRepository(
  Company,
  JobPost,
  JobApplication
);

const userService = new UserServices(
  userRepository,
  companyRepository,
  getSocketInstance()
);
const userController = new UserController(userService);

const userRoutes = Router();

userRoutes.post("/register", userController.registerUser);
userRoutes.post("/verify-otp", userController.otpVerification);
userRoutes.post("/resent-otp", userController.resentOtp);
userRoutes.post("/login", userController.loginUser);
userRoutes.post("/forgot-password-email", userController.forgotPasswordEmail);
userRoutes.post("/forgot-password-OTP", userController.forgotPasswordOTP);
userRoutes.post("/forgot-password-reset", userController.forgotPasswordReset);
userRoutes.get("/getAllJobPosts", userAuth, userController.getAllJobPosts);
// userRoutes.get("/getAllCompanies", userController.getAllCompaniesController);
userRoutes.get(
  "/user-profile/:user_id",
  userAuth,
  userController.getUserProfileController
);
userRoutes.put("/edit-user/:user_id", userAuth, userController.editUserDetails);
userRoutes.post(
  "/post-job-application",
  userAuth,
  upload.single("resume"),
  userController.newJobApplication
);
userRoutes.post(
  "/upload-profile-picture/:user_id",
  userAuth,
  upload.single("profilePicture"),
  userController.updateProfileImgController
);
userRoutes.post("/razorpay/create-order", userAuth, userController.createOrder);
userRoutes.post(
  "/subscribe/verify-payment",
  userAuth,
  userController.verifyPayment
);
userRoutes.get(
  `/subscription-history/:userId`,
  userController.getSubscriptionHistory
);
userRoutes.get(
  `/current-subscription/:userId`,
  userController.getCurrentSubscriptionDetail
);
userRoutes.get(
  "/job-applications/:user_id",
  userAuth,
  userController.getJobApplicationsByUserId
);
userRoutes.get("/search/users", userController.searchUser);

export default userRoutes;
