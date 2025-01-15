import { NextFunction, Request, Response } from "express";
import { IJobPost, ICompany } from "../Interfaces/common_interface";
import { IAdminServices } from "../Interfaces/admin_service_interface";
import HttpStatusCode from "../Enums/httpStatusCodes";

class AdminController {
  private adminService: IAdminServices;

  constructor(adminService: IAdminServices) {
    this.adminService = adminService;
  }

  loginAdmin = async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      console.log("admin login details", email, password);
      const serviceResponse = await this.adminService.loginAdmin(
        email,
        password
      );

      res.cookie("AdminRefreshToken", serviceResponse.adminRefreshToken, {
        httpOnly: true,
        sameSite: "none",
        secure: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      res.cookie("AdminAccessToken", serviceResponse.adminAccessToken, {
        httpOnly: true,
        sameSite: "none",
        secure: true,
        maxAge: 15 * 60 * 1000,
      });
      res.status(HttpStatusCode.OK).send(serviceResponse.email);
    } catch (error: any) {
      console.log("Admin := login error", error);
      if (error.message === "Invalid email") {
        res
          .status(HttpStatusCode.NOT_FOUND)
          .json({ message: "Email is wrong" });
      } else if (error.message === "Invalid password") {
        res
          .status(HttpStatusCode.NOT_FOUND)
          .json({ message: "password is wrong" });
      }
    }
  };

  fetchAllUserDetails = async (req: Request, res: Response) => {
    try {
      const userData = await this.adminService.fetchAllUserDetails();
      console.log(userData);

      if (userData) {
        res
          .status(HttpStatusCode.OK)
          .json({ status: true, userData: userData });
      }
    } catch (error: any) {
      console.log(`Error in emailValidation at userController : ${error}`);
      if (error.message === "users data not found") {
        res
          .status(HttpStatusCode.NOT_FOUND)
          .json({ message: "users data not found" });
      } else {
        res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
          message:
            "Something has went wrong. Please be calm and try again later.",
        });
      }
    }
  };
  fetchAllCompanyDetails = async (req: Request, res: Response) => {
    try {
      const companyData = await this.adminService.fetchAllCompanyDetails();

      if (companyData) {
        res
          .status(HttpStatusCode.OK)
          .json({ status: true, companyData: companyData });
      }
    } catch (error: any) {
      console.log(`Error in emailValidation at userController : ${error}`);
      if (error.message === "companies data not found") {
        res
          .status(HttpStatusCode.NOT_FOUND)
          .json({ message: "companies data not found" });
      } else {
        res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
          message:
            "Something has went wrong. Please be calm and try again later.",
        });
      }
    }
  };
  userBlockOrUnBlock = async (req: Request, res: Response) => {
    try {
      console.log(req.body);

      const user_id = req.body.user_id;
      const result = await this.adminService.userBlockOrUnBlock(user_id);

      if (result) {
        res.status(HttpStatusCode.OK).json({ status: true, userData: result });
      }
    } catch (error: any) {
      console.log(`Error in emailValidation at userController : ${error}`);
      if (error.message === "user not found") {
        res
          .status(HttpStatusCode.NOT_FOUND)
          .json({ message: "user not found" });
      } else {
        res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
          message:
            "Something has went wrong. Please be calm and try again later.",
        });
      }
    }
  };
  companyBlockOrUnBlock = async (req: Request, res: Response) => {
    try {
      const company_id = req.body.company_id;
      console.log("company_id at controller", company_id);

      const result = await this.adminService.companyBlockOrUnBlock(company_id);

      if (result) {
        res
          .status(HttpStatusCode.OK)
          .json({ status: true, companyData: result });
      }
    } catch (error: any) {
      console.log(`Error in emailValidation at userController : ${error}`);
      if (error.message === "company not found") {
        res
          .status(HttpStatusCode.NOT_FOUND)
          .json({ message: "company not found" });
      } else {
        res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
          message:
            "Something has went wrong. Please be calm and try again later.",
        });
      }
    }
  };

  getSubscriptionPlan = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const plan_id = req.body.plan_id;

      const result = await this.adminService.getSubscriptionPlans(plan_id);

      if (result) {
        res.status(HttpStatusCode.OK).json({ planData: result });
      }
    } catch (error: any) {
      console.log(`Error in emailValidation at userController : ${error}`);
      next(error);
    }
  };
  createNewSubscriptionPlan = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const planData = req.body;

      const result = await this.adminService.createNewSubscriptionPlan(
        planData
      );

      if (result) {
        res.status(HttpStatusCode.OK).json({ status: true });
      }
    } catch (error: any) {
      console.log(`Error in emailValidation at userController : ${error}`);
      next(error);
    }
  };
  
  editSubscriptionPlan = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const planData = req.body;
      console.log(planData);
      
      const result = await this.adminService.editSubscriptionPlan(planData);

      if (result) {
        res
          .status(HttpStatusCode.OK)
          .json({ status: true, message: "Plan updated Successfully" });
      }
    } catch (error: any) {
      console.log(`Error in emailValidation at userController : ${error}`);
      next(error);
    }
  };
}

export default AdminController;
