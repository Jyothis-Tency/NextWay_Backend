import { Model } from "mongoose";
import { ISubscriptionRepository } from "../Interfaces/subscription_repository_interface";
import {
  ISubscriptionDetails,
  ISubscriptionPlan,
} from "../Interfaces/common_interface";
import CustomError from "../Utils/customError";
import HttpStatusCode from "../Enums/httpStatusCodes";

class SubscriptionRepository implements ISubscriptionRepository {
  private subscriptionPlan: Model<ISubscriptionPlan>;
  private subscriptionDetails: Model<ISubscriptionDetails>;

  constructor(
    subscriptionPlan: Model<ISubscriptionPlan>,
    subscriptionDetails: Model<ISubscriptionDetails>
  ) {
    this.subscriptionPlan = subscriptionPlan;
    this.subscriptionDetails = subscriptionDetails;
  }

  findSubscriptionPlanById = async (
    planId: string
  ): Promise<ISubscriptionPlan | null> => {
    try {
      return await this.subscriptionPlan.findById(planId);
    } catch (error) {
      throw new CustomError(
        "Error fetching subscription plan by ID",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  createSubscriptionDetails = async (
    details: ISubscriptionDetails
  ): Promise<ISubscriptionDetails> => {
    try {
      return await this.subscriptionDetails.create(details);
    } catch (error) {
      throw new CustomError(
        "Error creating subscription details",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  updateSubscriptionStatus = async (
    subscriptionId: string,
    status: string
  ): Promise<ISubscriptionDetails | null> => {
    try {
      return await this.subscriptionDetails.findByIdAndUpdate(
        subscriptionId,
        { status },
        { new: true }
      );
    } catch (error) {
      throw new CustomError(
        "Error updating subscription status",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  findSubscription = async (
    subscriptionId: string
  ): Promise<ISubscriptionDetails | null> => {
    try {
      return await this.subscriptionDetails.findOne({subscriptionId: subscriptionId});
    } catch (error) {
      throw new CustomError(
        "Error fetching current subscription by user ID",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };
}

export default SubscriptionRepository;
