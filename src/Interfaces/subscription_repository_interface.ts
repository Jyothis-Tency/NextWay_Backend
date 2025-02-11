import { UpdateResult } from "mongodb";
import {
  ISubscriptionDetails,
  ISubscriptionPlan,
  ISubscriptionHistory,
} from "./common_interface";

export interface ISubscriptionRepository {
  findSubscriptionPlanById(planId: string): Promise<ISubscriptionPlan | null>;
  createSubscriptionDetails(
    details: ISubscriptionDetails
  ): Promise<ISubscriptionDetails>;
  updateSubscriptionStatus(
    matchCriteria: Record<string, any>,
    updateValues: Record<string, any>
  ): Promise<UpdateResult>;
  createSubscriptionHistory(
    details: ISubscriptionHistory
  ): Promise<ISubscriptionHistory>;
  findSubscription(
    subscriptionId: string
  ): Promise<ISubscriptionDetails | null>;
  findAllSubscriptions(): Promise<ISubscriptionDetails[]>;
  toggleSubscriptionPlanBlock(
    plan_id: string,
    isBlocked: boolean
  ): Promise<boolean>;
  updateUserIsSubscribed(
    user_id: string,
    isSubscribed: boolean,
    features: string[]
  ): Promise<boolean>;
  getSubscriptionPlans(
    plan_id?: string
  ): Promise<ISubscriptionPlan | ISubscriptionPlan[]>;
  getSubscriptionHistory(user_id: string): Promise<ISubscriptionHistory[]>;
  getCurrentSubscriptionDetails(
    user_id: string
  ): Promise<ISubscriptionDetails | null>;
}
