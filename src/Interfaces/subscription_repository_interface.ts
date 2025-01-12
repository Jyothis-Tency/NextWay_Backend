import { UpdateResult } from "mongodb";
import { ISubscriptionDetails, ISubscriptionPlan } from "./common_interface";

export interface ISubscriptionRepository {
  findSubscriptionPlanById(planId: string): Promise<ISubscriptionPlan | null>;
  createSubscriptionDetails(
    details: ISubscriptionDetails
  ): Promise<ISubscriptionDetails>;
  updateSubscriptionStatus  (
    matchCriteria: Record<string, any>,
    updateValues: Record<string, any>
  ): Promise<UpdateResult>;
  findSubscription(
    subscriptionId: string
  ): Promise<ISubscriptionDetails | null>;
}
