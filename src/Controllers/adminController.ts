import { NextFunction, Request, Response } from "express";
import { IJobPost, ICompany } from "../Interfaces/common_interface";
import { IAdminServices } from "../Interfaces/admin_service_interface";
import HttpStatusCode from "../Enums/httpStatusCodes";

class AdminController {
  private adminService: IAdminServices;

  constructor(adminService: IAdminServices) {
    this.adminService = adminService;
  }

  /**
   * Handles admin login with authentication token generation
   * @param req Request containing email and password in body
   * @param res Response to set admin auth cookies and return admin data
   * @param next Next function for error handling
   */
  loginAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;
      console.log("admin login details", email, password);
      const serviceResponse = await this.adminService.loginAdmin(
        email,
        password
      );

      res.cookie("AdminRefreshToken", serviceResponse.refreshToken, {
        httpOnly: true,
        sameSite: "none",
        secure: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      res.cookie("AdminAccessToken", serviceResponse.accessToken, {
        httpOnly: true,
        sameSite: "none",
        secure: true,
        maxAge: 15 * 60 * 1000,
      });
      res
        .status(HttpStatusCode.OK)
        .json({ adminData: serviceResponse.adminData });
    } catch (error: unknown) {
      next(error);
    }
  };

  /**
   * Retrieves details of all registered users
   * @param req Request object
   * @param res Response containing all user details
   * @param next Next function for error handling
   */
  fetchAllUserDetails = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      console.log("fetchAllUserDetails");

      const userData = await this.adminService.fetchAllUserDetails();
      console.log(userData);

      if (userData) {
        res
          .status(HttpStatusCode.OK)
          .json({ status: true, userData: userData });
      }
    } catch (error) {
      next(error);
    }
  };

  /**
   * Retrieves details of all registered companies
   * @param req Request object
   * @param res Response containing all company details
   * @param next Next function for error handling
   */
  fetchAllCompanyDetails = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const companyData = await this.adminService.fetchAllCompanyDetails();

      if (companyData) {
        res
          .status(HttpStatusCode.OK)
          .json({ status: true, companyData: companyData });
      }
    } catch (error) {
      next(error);
    }
  };

  /**
   * Toggles user account block status
   * @param req Request containing user_id in body
   * @param res Response with updated user data
   * @param next Next function for error handling
   */
  userBlockOrUnBlock = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      console.log(req.body);

      const user_id = req.body.user_id;
      const result = await this.adminService.userBlockOrUnBlock(user_id);

      if (result) {
        res.status(HttpStatusCode.OK).json({ status: true, userData: result });
      }
    } catch (error) {
      next(error);
    }
  };

  /**
   * Toggles company account block status
   * @param req Request containing company_id in body
   * @param res Response with updated company data
   * @param next Next function for error handling
   */
  companyBlockOrUnBlock = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const company_id = req.body.company_id;
      console.log("company_id at controller", company_id);

      const result = await this.adminService.companyBlockOrUnBlock(company_id);

      if (result) {
        res
          .status(HttpStatusCode.OK)
          .json({ status: true, companyData: result });
      }
    } catch (error) {
      next(error);
    }
  };

  /**
   * Retrieves details of a specific subscription plan
   * @param req Request containing plan_id in body
   * @param res Response with plan details
   * @param next Next function for error handling
   */
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
    } catch (error) {
      console.log(`Error in emailValidation at userController : ${error}`);
      next(error);
    }
  };

  /**
   * Creates a new subscription plan
   * @param req Request containing plan details in body
   * @param res Response to confirm plan creation
   * @param next Next function for error handling
   */
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
    } catch (error) {
      console.log(`Error in emailValidation at userController : ${error}`);
      next(error);
    }
  };

  /**
   * Updates existing subscription plan details
   * @param req Request containing updated plan data in body
   * @param res Response to confirm plan update
   * @param next Next function for error handling
   */
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
    } catch (error) {
      console.log(`Error in emailValidation at userController : ${error}`);
      next(error);
    }
  };

  /**
   * Retrieves profile images of all companies
   * @param req Request object
   * @param res Response with company profile images
   * @param next Next function for error handling
   */
  getAllCompanyProfileImages = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyImages =
        await this.adminService.getAllCompanyProfileImages();
      res.status(HttpStatusCode.OK).json(companyImages);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Retrieves profile images of all users
   * @param req Request object
   * @param res Response with user profile images
   * @param next Next function for error handling
   */
  getAllUserProfileImages = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userImages = await this.adminService.getAllUserProfileImages();
      res.status(HttpStatusCode.OK).json(userImages);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Retrieves all job posts with company information
   * @param req Request object
   * @param res Response containing job posts and associated companies
   * @param next Next function for error handling
   */
  getAllJobPosts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const serviceResponse = await this.adminService.getAllJobPosts();
      const { jobPosts, companies } = serviceResponse;
      res.status(HttpStatusCode.OK).json({ status: true, jobPosts, companies });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Fetches detailed information for a specific company
   * @param req Request containing company_id in params
   * @param res Response with company profile and base64 encoded image
   * @param next Next function for error handling
   */
  getCompanyDetails = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      console.log("getCompanyDetails");

      const company_id = req.params.company_id;
      console.log(company_id);

      const { companyProfile, imgBuffer } =
        await this.adminService.getCompanyDetails(company_id);
      let imageBase64 = "";
      if (imgBuffer) {
        imageBase64 = `data:image/jpeg;base64,${imgBuffer.toString("base64")}`;
      }
      res.status(HttpStatusCode.OK).json({
        status: true,
        companyProfile,
        image: imageBase64,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Fetches detailed information for a specific user
   * @param req Request containing user_id in params
   * @param res Response with user profile and base64 encoded image
   * @param next Next function for error handling
   */
  getUserDetails = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user_id = req.params.user_id;
      const { userProfile, imgBuffer } = await this.adminService.getUserDetails(
        user_id
      );
      let imageBase64 = "";
      if (imgBuffer) {
        imageBase64 = `data:image/jpeg;base64,${imgBuffer.toString("base64")}`;
      }
      res.status(HttpStatusCode.OK).json({
        status: true,
        userProfile,
        image: imageBase64,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Updates company verification status
   * @param req Request containing company_id in params and newStatus in body
   * @param res Response with updated verification status
   * @param next Next function for error handling
   */
  changeVerificationStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      console.log("changeVerificationStatus controller");

      const { newStatus } = req.body;
      const company_id = req.params.company_id;
      console.log(company_id, newStatus);

      const result = await this.adminService.changeVerificationStatus(
        company_id,
        newStatus
      );
      res.status(HttpStatusCode.OK).json({
        status: true,
        newStatus: result,
      });
    } catch (error) {
      next(error);
    }
  };
}

export default AdminController;
