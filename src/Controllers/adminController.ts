import { Request, Response } from "express";
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

  fetchAllSeekerDetails = async (req: Request, res: Response) => {
    try {
      const seekerData = await this.adminService.fetchAllSeekerDetails();
      console.log(seekerData);

      if (seekerData) {
        res
          .status(HttpStatusCode.OK)
          .json({ status: true, seekerData: seekerData });
      }
    } catch (error: any) {
      console.log(`Error in emailValidation at userController : ${error}`);
      if (error.message === "seekers data not found") {
        res
          .status(HttpStatusCode.NOT_FOUND)
          .json({ message: "seekers data not found" });
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
  seekerBlockOrUnBlock = async (req: Request, res: Response) => {
    try {
      console.log(req.body);

      const seeker_id = req.body.seeker_id;
      const result = await this.adminService.seekerBlockOrUnBlock(seeker_id);

      if (result) {
        res
          .status(HttpStatusCode.OK)
          .json({ status: true, seekerData: result });
      }
    } catch (error: any) {
      console.log(`Error in emailValidation at userController : ${error}`);
      if (error.message === "seeker not found") {
        res
          .status(HttpStatusCode.NOT_FOUND)
          .json({ message: "seeker not found" });
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
}

export default AdminController;
