import { Router } from "express";
import AdminController from "../Controllers/adminController";
import AdminServices from "../Services/adminServices";
import AdminRepository from "../Repository/adminRepository";
import Seeker from "../Models/seekerModel";
import Company from "../Models/companyModel";

const adminRepository = new AdminRepository(Company, Seeker);
const adminService = new AdminServices(adminRepository);
const adminController = new AdminController(adminService);

const adminRoutes = Router();

adminRoutes.post("/login", adminController.loginAdmin);
adminRoutes.get("/all-seekers", adminController.fetchAllSeekerDetails);
adminRoutes.get("/all-companies", adminController.fetchAllCompanyDetails);
adminRoutes.post("/block-unblock-seeker", adminController.seekerBlockOrUnBlock);
adminRoutes.post(
  "/block-unblock-company",
  adminController.companyBlockOrUnBlock
);

export default adminRoutes;
