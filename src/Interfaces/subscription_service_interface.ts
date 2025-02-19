import {
  ISubscriptionDetails,
  ISubscriptionPlan,
  IOrderResponse,
  ISubscriptionHistory,
  RazorpayPayload
} from "./common_interface";

export interface ISubscriptionServices {
  initializeSubscription(
    userId: string,
    planId: string
  ): Promise<IOrderResponse>;

  verifyPayment(
    razorpay_payment_id: string,
    razorpay_order_id: string,
    razorpay_signature: string
  ): Promise<string | undefined>;

  cancelSubscription(subscriptionId: string): Promise<boolean>;

  getAllSubscriptions(): Promise<ISubscriptionDetails[]>;

  webHookService(
    event: string,
    payload: RazorpayPayload,
    signature: string,
    body: string
  ): Promise<boolean>;
  getSubscriptionPlans(
    plan_id: string
  ): Promise<ISubscriptionPlan | ISubscriptionPlan[]>;
  getSubscriptionHistory(user_id: string): Promise<ISubscriptionHistory[]>;
  getCurrentSubscriptionDetail(
    user_id: string
  ): Promise<ISubscriptionDetails | null>;
}
