import { createRefreshToken, createToken } from "../Config/jwtConfig";
import { v4 as uuidv4 } from "uuid";
import { IAdminServices } from "../Interfaces/admin_service_interface";
import { IAdminRepository } from "../Interfaces/admin_repository_interface";
import {
  ICompany,
  ISubscriptionPlan,
  IUser,
} from "../Interfaces/common_interface";
import { platform } from "os";
import CustomError from "../Utils/customError";
import HttpStatusCode from "../Enums/httpStatusCodes";
import razorpayInstance from "../Config/razorpayConfig";
import mongoose from "mongoose";

const adminEmail = process.env.ADMIN_EMAIL!;
const adminPassword = process.env.ADMIN_PASSWORD!;

class AdminServices implements IAdminServices {
  private adminRepository: IAdminRepository;

  constructor(adminRepository: IAdminRepository) {
    this.adminRepository = adminRepository;
  }

  loginAdmin = (
    email: string,
    password: string
  ): { email: string; adminAccessToken: string; adminRefreshToken: string } => {
    try {
      console.log(adminEmail, adminPassword);
      console.log(email, password);

      if (email !== adminEmail) {
        throw new Error("Invalid email");
      } else if (password !== adminPassword) {
        throw new Error("Invalid password");
      }
      const adminAccessToken: string = createToken(email as string, "Admin");
      const adminRefreshToken: string = createRefreshToken(
        email as string,
        "Admin"
      );
      return { email, adminAccessToken, adminRefreshToken };
    } catch (error: any) {
      console.error("Error during admin login services:", error.message);
      throw error;
    }
  };

  fetchAllUserDetails = async (): Promise<IUser[] | null> => {
    try {
      const usersData = await this.adminRepository.getAllUsers();
      if (!usersData) {
        throw new Error("users data not found");
      }
      return usersData;
    } catch (error) {
      console.log(`Error in forgotPassword at userServices : ${error}`);
      throw error;
    }
  };
  fetchAllCompanyDetails = async (): Promise<ICompany[] | null> => {
    try {
      const companiesData = await this.adminRepository.getAllCompanies();
      if (!companiesData) {
        throw new Error("companies data not found");
      }
      return companiesData;
    } catch (error) {
      console.log(`Error in forgotPassword at userServices : ${error}`);
      throw error;
    }
  };

  userBlockOrUnBlock = async (user_id: string): Promise<IUser | null> => {
    try {
      const result = await this.adminRepository.toggleUserBlock(user_id);
      if (!result) {
        throw new Error("user not found");
      }
      return result;
    } catch (error) {
      console.log(`Error in forgotPassword at userServices : ${error}`);
      throw error;
    }
  };
  companyBlockOrUnBlock = async (
    company_id: string
  ): Promise<ICompany | null> => {
    try {
      console.log(company_id);
      const result = await this.adminRepository.toggleCompanyBlock(company_id);
      if (!result) {
        throw new Error("company not found");
      }
      return result;
    } catch (error) {
      console.log(`Error in forgotPassword at userServices : ${error}`);
      throw error;
    }
  };

  getSubscriptionPlans = async (
    plan_id: string
  ): Promise<ISubscriptionPlan | ISubscriptionPlan[]> => {
    try {
      const result = await this.adminRepository.getSubscriptionPlans(plan_id);
      if (!result) {
        throw new CustomError(
          "Error occurred getting subscription plan",
          HttpStatusCode.NOT_FOUND
        );
      }
      return result;
    } catch (error) {
      throw error;
    }
  };
  createNewSubscriptionPlan = async (
    planData: ISubscriptionPlan
  ): Promise<boolean> => {
    try {
      if (!planData) {
        throw new CustomError(
          "Plan Details are missing",
          HttpStatusCode.NOT_FOUND
        );
      }

      // Create plan in Razorpay first
      const razorpayPlan = await razorpayInstance.plans.create({
        period: "monthly",
        interval: 1,
        item: {
          name: planData.name,
          amount: planData.price * 100, // Convert to paise
          currency: "INR",
          description: `${
            planData.name
          } plan with features: ${planData.features.join(", ")}`,
        },
        notes: {
          duration: planData.duration.toString(),
          features: planData.features.join(","),
        },
      });

      if (!razorpayPlan.id) {
        throw new CustomError(
          "Error occurred while creating new plan",
          HttpStatusCode.NOT_IMPLEMENTED
        );
      }
      // Add Razorpay plan ID to our plan data
      const planDataWithRazorpay: Partial<ISubscriptionPlan> = {
        name: planData.name,
        price: planData.price,
        duration: planData.duration,
        features: planData.features,
        razorpayPlanId: razorpayPlan.id,
      };

      const result = await this.adminRepository.createSubscriptionPlan(
        planDataWithRazorpay as ISubscriptionPlan
      );

      if (!result._id) {
        // If MongoDB creation fails, delete the Razorpay plan
        // await razorpayInstance.plans.delete(razorpayPlan.id);
        throw new CustomError(
          "Error occurred while creating new plan",
          HttpStatusCode.NOT_IMPLEMENTED
        );
      }
      return true;
    } catch (error) {
      console.error("Error in createNewSubscriptionPlan:", error);
      throw error;
    }
  };

  editSubscriptionPlan = async (
    planData: ISubscriptionPlan
  ): Promise<boolean> => {
    try {
      if (!planData) {
        throw new CustomError(
          "Plan Details are missing",
          HttpStatusCode.NOT_FOUND
        );
      }

      // Get existing plan to check if we need to update Razorpay
      const existingPlan = (await this.adminRepository.getSubscriptionPlans(
        (planData._id as mongoose.Types.ObjectId).toString()
      )) as ISubscriptionPlan;

      if (!existingPlan) {
        throw new CustomError("Plan not found", HttpStatusCode.NOT_FOUND);
      }

      // If price changed, create new plan in Razorpay (can't update existing plan's price)
      if (existingPlan.price !== planData.price) {
        // Create new plan in Razorpay
        const newRazorpayPlan = await razorpayInstance.plans.create({
          period: "monthly",
          interval: 1,
          item: {
            name: planData.name,
            amount: planData.price * 100,
            currency: "INR",
            description: `${
              planData.name
            } plan with features: ${planData.features.join(", ")}`,
          },
          notes: {
            duration: planData.duration.toString(),
            features: planData.features.join(","),
          },
        });

        // Update plan data with new Razorpay plan ID
        planData.razorpayPlanId = newRazorpayPlan.id;
      }

      const result = await this.adminRepository.editSubscriptionPlan(planData);

      if (result.matchedCount === 0) {
        throw new CustomError("Not found the plan", HttpStatusCode.NOT_FOUND);
      }

      if (result.matchedCount === 1 && result.modifiedCount !== 1) {
        throw new CustomError(
          "Plan exist with same details",
          HttpStatusCode.NOT_IMPLEMENTED
        );
      }

      return true;
    } catch (error) {
      console.error("Error in editSubscriptionPlan:", error);
      throw error;
    }
  };
}

export default AdminServices;
