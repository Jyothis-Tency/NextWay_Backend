import { Router } from "express";
import AdminController from "../Controllers/adminController";
import AdminServices from "../Services/adminServices";
import AdminRepository from "../Repository/adminRepository";
import User from "../Models/userModel";
import Company from "../Models/companyModel";
import SubscriptionPlan from "../Models/subscriptionPlanModel";

const adminRepository = new AdminRepository(Company, User, SubscriptionPlan);
const adminService = new AdminServices(adminRepository);
const adminController = new AdminController(adminService);

const adminRoutes = Router();

adminRoutes.post("/login", adminController.loginAdmin);
adminRoutes.get("/all-users", adminController.fetchAllUserDetails);
adminRoutes.get("/all-companies", adminController.fetchAllCompanyDetails);
adminRoutes.post("/block-unblock-user", adminController.userBlockOrUnBlock);
adminRoutes.post(
  "/block-unblock-company",
  adminController.companyBlockOrUnBlock
);
adminRoutes.get(
  "/get-subscription-plan",
  adminController.getSubscriptionPlan
);
adminRoutes.post(
  "/create-subscription-plan",
  adminController.createNewSubscriptionPlan
);
adminRoutes.put(
  "/edit-subscription-plan",
  adminController.editSubscriptionPlan
);

export default adminRoutes;
