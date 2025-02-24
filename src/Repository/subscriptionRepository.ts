import { Model } from "mongoose";
import { ISubscriptionRepository } from "../Interfaces/subscription_repository_interface";
import {
  ISubscriptionDetails,
  ISubscriptionPlan,
  ISubscriptionHistory,
  IUser,
} from "../Interfaces/common_interface";
import CustomError from "../Utils/customError";
import HttpStatusCode from "../Enums/httpStatusCodes";
import { UpdateResult } from "mongodb";
import { Types } from "mongoose";

class SubscriptionRepository implements ISubscriptionRepository {
  private subscriptionPlan: Model<ISubscriptionPlan>;
  private subscriptionDetails: Model<ISubscriptionDetails>;
  private subscriptionHistory: Model<ISubscriptionHistory>;
  private User: Model<IUser>;

  constructor(
    subscriptionPlan: Model<ISubscriptionPlan>,
    subscriptionDetails: Model<ISubscriptionDetails>,
    subscriptionHistory: Model<ISubscriptionHistory>,
    User: Model<IUser>
  ) {
    this.subscriptionPlan = subscriptionPlan;
    this.subscriptionDetails = subscriptionDetails;
    this.subscriptionHistory = subscriptionHistory;
    this.User = User;
  }

  findSubscriptionPlanById = async (
    planId: string
  ): Promise<ISubscriptionPlan | null> => {
    try {
      return await this.subscriptionPlan.findById(planId);
    } catch (error: unknown) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in subscription findSubscriptionPlanById: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  createSubscriptionDetails = async (
    details: ISubscriptionDetails
  ): Promise<ISubscriptionDetails> => {
    try {
      return await this.subscriptionDetails.create(details);
    } catch (error: unknown) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in subscription createSubscriptionDetails: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  updateSubscriptionStatus = async (
    matchCriteria: Record<string, string | boolean>,
    updateValues: Record<string, string | boolean | Date>
  ): Promise<UpdateResult> => {
    try {
      return await this.subscriptionDetails.updateMany(
        matchCriteria,
        updateValues,
        { upsert: false } // This is to prevent creating a new document if it doesn't exist
      );
    } catch (error: unknown) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in subscription updateSubscriptionStatus: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  createSubscriptionHistory = async (
    details: ISubscriptionHistory
  ): Promise<ISubscriptionHistory> => {
    try {
      const historyDetails = {
        user_id: details.user_id,
        plan_id: details.plan_id,
        planName: details.planName,
        createdType: details.createdType,
        period: details.period,
        startDate: details.startDate,
        endDate: details.endDate,
        price: details.price,
      };
      return await this.subscriptionHistory.create(historyDetails);
    } catch (error: unknown) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in subscription createSubscriptionHistory: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  findSubscription = async (
    subscriptionId: string
  ): Promise<ISubscriptionDetails | null> => {
    try {
      return await this.subscriptionDetails.findOne({
        subscriptionId: subscriptionId,
      });
    } catch (error: unknown) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in subscription findSubscription: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  findAllSubscriptions = async (): Promise<ISubscriptionDetails[]> => {
    try {
      return await this.subscriptionDetails.find();
    } catch (error: unknown) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in subscription findAllSubscriptions: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  toggleSubscriptionPlanBlock = async (
    plan_id: string,
    isBlocked: boolean
  ): Promise<boolean> => {
    try {
      await this.subscriptionPlan.updateOne(
        { _id: plan_id },
        { $set: { isBlocked } }
      );
      return true;
    } catch (error: unknown) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in subscription toggleSubscriptionPlanBlock: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  updateUserIsSubscribed = async (
    user_id: string,
    isSubscribed: boolean,
    features: string[]
  ): Promise<boolean> => {
    try {
      await this.User.updateOne(
        { user_id: user_id },
        { $set: { isSubscribed: isSubscribed, subscriptionFeatures: features } }
      );
      return true;
    } catch (error: unknown) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in subscription updateUserIsSubscribed: ${
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
        `Error in subscription getSubscriptionPlans: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  getSubscriptionHistory = async (
    user_id: string
  ): Promise<ISubscriptionHistory[]> => {
    try {
      const subscriptionHistory = await this.subscriptionHistory
        .find({
          user_id: new Types.ObjectId(user_id),
        })
        .sort({ createdAt: -1 });
      return subscriptionHistory;
    } catch (error: unknown) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in subscription getSubscriptionHistory: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  getCurrentSubscriptionDetails = async (
    user_id: string
  ): Promise<ISubscriptionDetails | null> => {
    try {
      const result = await this.subscriptionDetails.findOne({
        user_id: user_id,
        isCurrent: true,
      });
      return result;
    } catch (error: unknown) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in subscription getCurrentSubscriptionDetails: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  getExpiredSubscriptions = async (
    today: Date
  ): Promise<ISubscriptionDetails[]> => {
    try {
      const result = await this.subscriptionDetails.find({
        endDate: { $lt: today },
        isCurrent: true,
      });
      return result;
    } catch (error: unknown) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in subscription getExpiredSubscriptions: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };
}

export default SubscriptionRepository;
