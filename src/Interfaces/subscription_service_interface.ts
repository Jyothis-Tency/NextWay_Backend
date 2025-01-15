import {
  ISubscriptionDetails,
  ISubscriptionPlan,
  IOrderResponse,
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
  ):Promise<string|undefined>;

  cancelSubscription(
    subscriptionId: string
  ): Promise<boolean>;

  getAllSubscriptions(): Promise<ISubscriptionDetails[]>;

  webHookService(
    event: string,
    payload: any,
    signature: string,
    body: any
  ): Promise<boolean>;
}
