import { Router } from "express";
import SeekerController from "../Controllers/seekerController";
import SeekerServices from "../Services/seekerServices";
import SeekerRepository from "../Repository/seekerRepository";
import Seeker from "../Models/seekerModel";
import Company from "../Models/companyModel";
import JobPost from "../Models/jobPostModel";
import CompanyRepository from "../Repository/companyRepository";
import seekerAuth from "../Config/seekerAuth";
import JobApplication from "../Models/jobApplicationModel";
import {upload} from '../Config/multerConfig'

const seekerRepository = new SeekerRepository(Seeker, Company,JobApplication);
const companyRepository = new CompanyRepository(Company, JobPost,JobApplication);
const seekerService = new SeekerServices(seekerRepository, companyRepository);
const seekerController = new SeekerController(seekerService);

const seekerRoutes = Router();

seekerRoutes.post("/register", seekerController.registerSeeker);
seekerRoutes.post("/verify-otp", seekerController.otpVerification);
seekerRoutes.post("/resent-otp", seekerController.resentOtp);
seekerRoutes.post("/login", seekerController.loginSeeker);
seekerRoutes.post(
  "/forgot-password-email",
  seekerController.forgotPasswordEmail
);
seekerRoutes.post("/forgot-password-OTP", seekerController.forgotPasswordOTP);
seekerRoutes.post(
  "/forgot-password-reset",
  seekerController.forgotPasswordReset
);
seekerRoutes.get(
  "/getAllJobPosts",
  seekerAuth,
  seekerController.getAllJobPosts
);
// seekerRoutes.get("/getAllCompanies", seekerController.getAllCompaniesController);
seekerRoutes.get(
  "/seeker-profile/:seeker_id",
  seekerAuth,
  seekerController.getSeekerProfileController
);
seekerRoutes.put(
  "/edit-seeker/:seeker_id",
  seekerAuth,
  seekerController.editSeekerDetails
);
seekerRoutes.post(
  "/post-job-application",
  seekerAuth,
  upload.single('resume'),
  seekerController.newJobApplication
);
seekerRoutes.post(
  "/upload-profile-picture/:seeker_id",
  seekerAuth,
  upload.single("profilePicture"),
  seekerController.updateProfileImgController
);

export default seekerRoutes;
