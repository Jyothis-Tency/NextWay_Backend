import { ISubscriptionDetails, ISubscriptionPlan } from "./common_interface";

export interface ISubscriptionRepository {
  findSubscriptionPlanById(planId: string): Promise<ISubscriptionPlan | null>;
  createSubscriptionDetails(
    details: ISubscriptionDetails
  ): Promise<ISubscriptionDetails>;
  updateSubscriptionStatus(
    subscriptionId: string,
    status: string
  ): Promise<ISubscriptionDetails | null>;
  findSubscription(
    subscriptionId: string
  ): Promise<ISubscriptionDetails | null>;
}
