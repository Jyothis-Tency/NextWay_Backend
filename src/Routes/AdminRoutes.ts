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

adminRoutes
  .post("/login", adminController.loginAdmin)
  .get("/all-users", adminController.fetchAllUserDetails)
  .get("/all-companies", adminController.fetchAllCompanyDetails)
  .post("/block-unblock-user", adminController.userBlockOrUnBlock)
  .post("/block-unblock-company", adminController.companyBlockOrUnBlock)
  .get("/get-subscription-plan", adminController.getSubscriptionPlan)
  .post("/create-subscription-plan", adminController.createNewSubscriptionPlan)
  .put("/edit-subscription-plan", adminController.editSubscriptionPlan);
  

export default adminRoutes;
