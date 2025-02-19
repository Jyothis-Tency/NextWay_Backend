import { Model, Types, UpdateResult } from "mongoose";
import { ICompanyRepository } from "../Interfaces/company_repository_interface";
import {
  ICompany,
  IUser,
  ISubscriptionPlan,
  IAdmin,
} from "../Interfaces/common_interface";
import { IJobPost } from "../Interfaces/common_interface";
import { IAdminRepository } from "../Interfaces/admin_repository_interface";
import CustomError from "../Utils/customError";
import HttpStatusCode from "../Enums/httpStatusCodes";

class AdminRepository implements IAdminRepository {
  private admin = Model<IAdmin>;
  private company = Model<ICompany>;
  private user = Model<IUser>;
  private subscriptionPlan = Model<ISubscriptionPlan>;

  constructor(
    adminModel: Model<IAdmin>,
    companyModel: Model<ICompany>,
    userModel: Model<IUser>,
    subscriptionPlanModel: Model<ISubscriptionPlan>
  ) {
    this.admin = adminModel;
    this.company = companyModel;
    this.user = userModel;
    this.subscriptionPlan = subscriptionPlanModel;
  }

  findAdmin = async (email: string): Promise<IAdmin | null> => {
    try {
      return await this.admin.findOne({ email: email });
    } catch (error: unknown) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in admin findAdmin: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  getAllUsers = async (): Promise<IUser[] | null> => {
    try {
      return await this.user.find();
    } catch (error: unknown) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in admin getAllUsers: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  getAllCompanies = async (): Promise<ICompany[] | null> => {
    try {
      return await this.company.find();
    } catch (error: unknown) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in admin getAllCompanies: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  toggleCompanyBlock = async (company_id: string): Promise<ICompany | null> => {
    try {
      // Find the company by ID
      console.log("company_id", company_id);

      const company = await this.company.findOne({ company_id: company_id });
      console.log("company -", company);

      if (!company) {
        throw new Error(`Company with ID ${company_id} not found.`);
      }

      // Toggle the isBlocked field
      company.isBlocked = !company.isBlocked;

      // Save the updated company document
      await company.save();

      return company;
    } catch (error: unknown) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in admin toggleCompanyBlock: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  toggleUserBlock = async (user_id: string): Promise<IUser | null> => {
    try {
      // Find the company by ID
      const user = await this.user.findOne({ user_id: user_id });

      if (!user) {
        throw new Error(`Company with ID ${user_id} not found.`);
      }

      // Toggle the isBlocked field
      user.isBlocked = !user.isBlocked;

      // Save the updated user document
      await user.save();

      return user;
    } catch (error: unknown) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in admin toggleUserBlock: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  getSubscriptionPlans = async (
    plan_id?: string
  ): Promise<ISubscriptionPlan | ISubscriptionPlan[]> => {
    try {
      let result;

      if (plan_id) {
        result = await this.subscriptionPlan.findById(plan_id);
        if (!result) {
          throw new CustomError(
            "Subscription plan not found",
            HttpStatusCode.NOT_FOUND
          );
        }
      } else {
        result = await this.subscriptionPlan.find();
      }

      return result;
    } catch (error: unknown) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in admin getSubscriptionPlans: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  createSubscriptionPlan = async (
    planData: ISubscriptionPlan
  ): Promise<ISubscriptionPlan> => {
    try {
      console.log("planData in repo", planData);
      const { name, price } = planData;
      const isExisting = await this.subscriptionPlan.findOne({
        $or: [{ name }, { price }],
      });
      if (isExisting) {
        let message =
          isExisting.name === name
            ? "A plan with this name already exists"
            : "A plan with this price already exists";
        throw new CustomError(message, HttpStatusCode.CONFLICT);
      }
      let result = null;
      result = await this.subscriptionPlan.create(planData);
      return result;
    } catch (error: unknown) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in admin createSubscriptionPlan: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  editSubscriptionPlan = async (
    planData: ISubscriptionPlan
  ): Promise<UpdateResult> => {
    try {
      if (!planData) {
        throw new CustomError(
          "Plan Details are missing",
          HttpStatusCode.NOT_FOUND
        );
      }
      let result = null;

      result = await this.subscriptionPlan.updateOne(
        { _id: planData._id },
        { $set: planData }
      );
      console.log(result);

      if (!result) {
        throw new CustomError(
          "Error in edit new plan",
          HttpStatusCode.NOT_MODIFIED
        );
      }
      return result;
    } catch (error: unknown) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in admin editSubscriptionPlan: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };
}

export default AdminRepository;
