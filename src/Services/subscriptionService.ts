import razorpayInstance from "../Config/razorpayConfig";
import HttpStatusCode from "../Enums/httpStatusCodes";
import {
  ISubscriptionDetails,
  IOrderResponse,
} from "../Interfaces/common_interface";
import { ISubscriptionRepository } from "../Interfaces/subscription_repository_interface";
import { IUserRepository } from "../Interfaces/user_repository_interface";
import { ISubscriptionServices } from "../Interfaces/subscription_service_interface";
import CustomError from "../Utils/customError";
import dotenv from "dotenv";
import crypto from "crypto";
import { ObjectId } from "mongodb";

dotenv.config();

class SubscriptionServices implements ISubscriptionServices {
  private subscriptionRepository: ISubscriptionRepository;
  private userRepository: IUserRepository;

  constructor(
    subscriptionRepository: ISubscriptionRepository,
    userRepository: IUserRepository
  ) {
    this.subscriptionRepository = subscriptionRepository;
    this.userRepository = userRepository;
  }

  initializeSubscription = async (
    userId: string,
    planId: string
  ): Promise<IOrderResponse> => {
    try {
      const plan = await this.subscriptionRepository.findSubscriptionPlanById(
        planId
      );
      const user = await this.userRepository.getUserById(userId);
      if (!plan) {
        throw new CustomError("Plan not exist", HttpStatusCode.NOT_FOUND);
      }
      if (!user) {
        throw new CustomError("User not exist", HttpStatusCode.NOT_FOUND);
      }

      const order = await razorpayInstance.orders.create({
        amount: plan.price * 100, // Amount in paise
        currency: "INR",
        payment_capture: true,
        notes: {
          userId: userId,
          planId: planId,
        },
      });
      return {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
      };
    } catch (error) {
      throw new CustomError(
        "Error creating subscription details",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  verifyPayment = async (
    razorpay_payment_id: string,
    razorpay_order_id: string,
    razorpay_signature: string
  ): Promise<string | undefined> => {
    try {
      const order = await razorpayInstance.orders.fetch(razorpay_order_id);
      if (!order.notes) {
        throw new CustomError(
          "Order notes are missing",
          HttpStatusCode.BAD_REQUEST
        );
      }
      const secret = process.env.RAZORPAY_SECRET;
      if (!secret) {
        throw new CustomError(
          "secret not contains any value",
          HttpStatusCode.NOT_FOUND
        );
      }
      const generatedSignature = crypto
        .createHmac("sha256", secret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

      if (generatedSignature === razorpay_signature) {
        throw new CustomError("Invalid signature", HttpStatusCode.NOT_FOUND);
      }
      const planId = order.notes.planId as string | "";
      const plan = await this.subscriptionRepository.findSubscriptionPlanById(
        planId
      );
      if (!plan) {
        throw new CustomError("Plan not exist", HttpStatusCode.NOT_FOUND);
      }
      const subscription = await razorpayInstance.subscriptions.create({
        plan_id: planId,
        customer_notify: 1,
        total_count: 12, // Number of billing cycles
        quantity: 1,
        notes: {
          userId: order.notes.userId,
          planId: order.notes.planId,
        },
      });
      return subscription.id;
    } catch (error) {
      throw new CustomError(
        "Error creating subscription details",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  cancelSubscription = async (subscriptionId: string): Promise<boolean> => {
    try {
      const subscriptionDetails =
        await this.subscriptionRepository.findSubscription(subscriptionId);
      if (subscriptionDetails?.status !== "active") {
        throw new Error("Active subscription not found");
      }
      await razorpayInstance.subscriptions.cancel(subscriptionId);
      // Update subscription status in the database
      await this.subscriptionRepository.updateSubscriptionStatus(
        subscriptionId,
        "cancelled"
      );
      return true;
    } catch (error) {
      throw new CustomError(
        "Error creating subscription details",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  webHookService = async (
    event: string,
    payload: any,
    signature: string,
    body: any
  ): Promise<boolean> => {
    try {
      const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
      if (!secret) {
        throw new CustomError(
          "secret not contains any value",
          HttpStatusCode.NOT_FOUND
        );
      }
      const jsonBody = JSON.parse(body);
      const generatedSignature = crypto
        .createHmac("sha256", secret)
        .update(JSON.stringify(jsonBody))
        .digest("hex");
      if (signature === generatedSignature) {
        console.log("Webhook received successfully");
      } else {
        throw new CustomError(
          "Invalid webhook signature",
          HttpStatusCode.NOT_FOUND
        );
      }

      // switch (event) {
      //   case "subscription.activated":
      //     await this.handleSubscriptionActivated(payload);
      //     break;
      //   case "subscription.charged":
      //     await this.handleSubscriptionCharged(payload);
      //     break;
      //   case "subscription.cancelled":
      //     await this.handleSubscriptionCancelled(payload);
      //     break;
      //   case "subscription.pending":
      //     await this.handleSubscriptionPending(payload);
      //     break;
      // }

      return true;
    } catch (error) {
      throw new CustomError(
        "Error creating subscription details",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  // handleSubscriptionCharged=async(payload: any) =>{
  //   const { subscription } = payload;

  //   // Update subscription end date
  //   const subscriptionDetails = await this.subscriptionRepository.findSubscription(subscription.id);

  //   if (subscriptionDetails) {
  //     const plan = await SubscriptionPlan.findById(subscriptionDetails.plan_id);

  //     subscriptionDetails.endDate = new Date(
  //       subscriptionDetails.endDate.getTime() +
  //         plan.duration * 24 * 60 * 60 * 1000
  //     );
  //     await subscriptionDetails.save();
  //   }
  // }
}

export default SubscriptionServices;
