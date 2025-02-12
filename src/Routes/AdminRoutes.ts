import { Router } from "express";
import AdminController from "../Controllers/adminController";
import AdminServices from "../Services/adminServices";
import AdminRepository from "../Repository/adminRepository";
import User from "../Models/userModel";
import Company from "../Models/companyModel";
import Admin from "../Models/AdminModel";
import SubscriptionPlan from "../Models/subscriptionPlanModel";
import CompanyRepository from "../Repository/companyRepository";
import UserRepository from "../Repository/userRepository";
import JobPost from "../Models/jobPostModel";
import JobApplication from "../Models/jobApplicationModel";
import SubscriptionDetails from "../Models/subscriptionDetails";
import SubscriptionHistory from "../Models/SubscriptionHistory";
import { adminAuth } from "../Middleware/adminAuth";

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

const adminRepository = new AdminRepository(Admin,Company, User, SubscriptionPlan);
const adminService = new AdminServices(
  adminRepository,
  userRepository,
  companyRepository
);
const adminController = new AdminController(adminService);

const adminRoutes = Router();

adminRoutes
  .post("/login", adminController.loginAdmin)
  .get("/all-users", adminAuth, adminController.fetchAllUserDetails)
  .get("/all-companies", adminAuth, adminController.fetchAllCompanyDetails)
  .post("/block-unblock-user", adminAuth, adminController.userBlockOrUnBlock)
  .post(
    "/block-unblock-company",
    adminAuth,
    adminController.companyBlockOrUnBlock
  )
  .get("/get-subscription-plan", adminAuth, adminController.getSubscriptionPlan)
  .post(
    "/create-subscription-plan",
    adminAuth,
    adminController.createNewSubscriptionPlan
  )
  .put(
    "/edit-subscription-plan",
    adminAuth,
    adminController.editSubscriptionPlan
  )
  .get(
    "/getAllCompanyProfileImages",
    adminAuth,
    adminController.getAllCompanyProfileImages
  )
  .get(
    "/getAllUserProfileImages",
    adminAuth,
    adminController.getAllUserProfileImages
  )
  .get("/getAllJobPosts", adminAuth, adminController.getAllJobPosts)
  .get("/get-company/:company_id", adminAuth, adminController.getCompanyDetails)
  .get("/get-user/:user_id", adminAuth, adminController.getUserDetails)
  .patch("/update-verification/:company_id",adminAuth,adminController.changeVerificationStatus);

export default adminRoutes;
