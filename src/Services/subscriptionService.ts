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

import { getSubscriptionRoomName } from "../Config/socketConfig";
import { Server } from "socket.io";

dotenv.config();

class SubscriptionServices implements ISubscriptionServices {
  private subscriptionRepository: ISubscriptionRepository;
  private userRepository: IUserRepository;
  private io: Server;
  constructor(
    subscriptionRepository: ISubscriptionRepository,
    userRepository: IUserRepository,
    io: Server
  ) {
    this.subscriptionRepository = subscriptionRepository;
    this.userRepository = userRepository;
    this.io = io;
  }

  initializeSubscription = async (
    userId: string,
    planId: string
  ): Promise<IOrderResponse> => {
    try {
      console.log("initializeSubscription subscriptionService");
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
    } catch (error: any) {
      console.error(error.message);
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
      console.log("verifyPayment subscriptionService");

      const order = await razorpayInstance.orders.fetch(razorpay_order_id);
      if (!order.notes) {
        throw new CustomError(
          "Order notes are missing",
          HttpStatusCode.BAD_REQUEST
        );
      }

      const secret = process.env.RAZORPAY_KEY_SECRET;
      if (!secret) {
        throw new CustomError(
          "secret not contains any value",
          HttpStatusCode.NOT_FOUND
        );
      }
      const generatedSignature = crypto
        .createHmac("sha256", secret)
        .update(razorpay_order_id + "|" + razorpay_payment_id)
        .digest("hex");

      if (generatedSignature !== razorpay_signature) {
        throw new CustomError("Invalid signature", HttpStatusCode.NOT_FOUND);
      }

      const planId = order.notes.planId as string | "";

      const plan = await this.subscriptionRepository.findSubscriptionPlanById(
        planId
      );

      if (!plan) {
        throw new CustomError("Plan not exist", HttpStatusCode.NOT_FOUND);
      }

      // const userId = order.notes.userId?.toString()|""
      // const user = await this.userRepository.getUserById(us);
      // if (!user) {
      //   throw new CustomError("User not found", HttpStatusCode.NOT_FOUND);
      // }

      const subscription = await razorpayInstance.subscriptions.create({
        plan_id: plan.razorpayPlanId,
        customer_notify: 1,
        total_count: 12,
        quantity: 1,
        notes: {
          userId: order.notes.userId,
          planId: order.notes.planId,
        },
      });

      const updateResult =
        await this.subscriptionRepository.updateSubscriptionStatus(
          { paymentId: order.id },
          { subscriptionId: subscription.id }
        );

      return "Subscription created successfully";
    } catch (error: any) {
      console.error("Detailed error:", error);
      throw new CustomError(
        "Error verifying subscription details",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  cancelSubscription = async (subscriptionId: string): Promise<boolean> => {
    try {
      console.log("cancelSubscription subscriptionService");
      const subscriptionDetails =
        await this.subscriptionRepository.findSubscription(subscriptionId);
      if (subscriptionDetails?.status !== "active") {
        throw new Error("Active subscription not found");
      }
      await razorpayInstance.subscriptions.cancel(subscriptionId);
      // Update subscription status in the database
      await this.subscriptionRepository.updateSubscriptionStatus(
        { subscriptionId: subscriptionId },
        { status: "cancelled", isCurrent: false }
      );
      return true;
    } catch (error) {
      throw new CustomError(
        "Error cancelling subscription details",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  getAllSubscriptions = async (): Promise<ISubscriptionDetails[]> => {
    try {
      console.log("getAllSubscriptions subscriptionService");
      return await this.subscriptionRepository.findAllSubscriptions();
    } catch (error) {
      throw new CustomError(
        "Error fetching subscription details",
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
      console.log("WebhookService");

      const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
      if (!secret) {
        throw new CustomError(
          "secret not contains any value",
          HttpStatusCode.NOT_FOUND
        );
      }

      const generatedSignature = crypto
        .createHmac("sha256", secret)
        .update(JSON.stringify(body))
        .digest("hex");

      if (signature !== generatedSignature) {
        throw new CustomError(
          "Invalid webhook signature",
          HttpStatusCode.NOT_FOUND
        );
      }

      // New logic to handle different events
      switch (event) {
        case "order.paid":
          await this.handleOrderPaid(payload);
          break;
        case "payment.captured":
          await this.handlePaymentCaptured(payload);
          break;
        case "payment.failed":
          await this.handlePaymentFailed(payload);
          break;
        case "payment.authorized":
          await this.handlePaymentAuthorized(payload);
          break;
        case "subscription.charged":
          await this.handleSubscriptionCharged(payload);
          break;
        case "subscription.cancelled":
          await this.handleSubscriptionCancelled(payload);
          break;
        default:
          console.warn(`Unhandled event: ${event}`);
      }

      return true;
    } catch (error: any) {
      console.error("Error processing webhook:", error.message);
      throw new CustomError(
        "Error processing webhook",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  // New methods to handle webhook events
  private handleOrderPaid = async (payload: any) => {
    console.log("handleOrderPaid subscriptionService");

    const order = payload.order.entity;

    if (!order || !order.notes) {
      throw new CustomError(
        "Order or order notes are missing in handleOrderPaid",
        HttpStatusCode.BAD_REQUEST
      );
    }

    const { userId, planId } = order.notes; // Destructure safely
    const plan = await this.subscriptionRepository.findSubscriptionPlanById(
      planId
    );

    // Deactivate any current subscription
    await this.subscriptionRepository.updateSubscriptionStatus(
      { user_id: userId, isCurrent: true },
      { isCurrent: false }
    );

    // Create new subscription details
    if (!plan) {
      throw new CustomError("Plan not found", HttpStatusCode.NOT_FOUND);
    }

    const newSubscription =
      await this.subscriptionRepository.createSubscriptionDetails({
        user_id: userId,
        plan_id: planId || "",
        planName: plan.name || "Unknown Plan",
        startDate: new Date(),
        endDate: new Date(Date.now() + plan.duration * 24 * 60 * 60 * 1000),
        price: plan.price,
        features: plan.features,
        paymentId: order.id,
        status: "active",
        isCurrent: true,
        subscriptionId: order.id,
      });

    const roomName = getSubscriptionRoomName(userId);
    this.io.to(roomName).emit("subscription:updated", {
      type: "new_subscription",
      subscription: newSubscription,
    });
  };

  private handlePaymentCaptured = async (payload: any) => {
    console.log("handlePaymentCaptured subscriptionService");
    const { payment } = payload;

    const order = await razorpayInstance.orders.fetch(payment.entity.order_id);

    // Ensure order is fetched and contains notes
    if (!order || !order.notes) {
      throw new CustomError(
        "Order or order notes are missing in handlePaymentCaptured",
        HttpStatusCode.BAD_REQUEST
      );
    }

    const { userId, planId } = order.notes; // Destructure safely
    // Update subscription status if it exists
    await this.subscriptionRepository.updateSubscriptionStatus(
      { paymentId: payment.id },
      { status: "active" }
    );
  };

  private handlePaymentFailed = async (payload: any) => {
    console.log("handlePaymentFailed subscriptionService");
    const { payment } = payload;

    // Update subscription status
    await this.subscriptionRepository.updateSubscriptionStatus(
      { paymentId: payment.id },
      { status: "failed", isCurrent: false }
    );
  };

  private handleSubscriptionCharged = async (payload: any) => {
    console.log("handleSubscriptionCharged subscriptionService");
    const { subscription } = payload;

    // Update subscription end date
    const subscriptionDetails =
      await this.subscriptionRepository.findSubscription(subscription.id);

    if (subscriptionDetails) {
      const plan = await this.subscriptionRepository.findSubscriptionPlanById(
        subscriptionDetails.plan_id.toString()
      );
      if (!plan) {
        throw new CustomError(
          "Error processing webhook in handleSubscriptionCharged",
          HttpStatusCode.INTERNAL_SERVER_ERROR
        );
      }

      const newEndDate = new Date(
        subscriptionDetails.endDate.getTime() +
          plan.duration * 24 * 60 * 60 * 1000
      );

      subscriptionDetails.endDate = new Date(
        subscriptionDetails.endDate.getTime() +
          plan.duration * 24 * 60 * 60 * 1000
      );
      subscriptionDetails.paymentId = subscription.payment_id; // Update with new payment ID
      await this.subscriptionRepository.updateSubscriptionStatus(
        { subscriptionId: subscriptionDetails.subscriptionId },
        {
          endDate: subscriptionDetails.endDate,
          paymentId: subscription.payment_id,
        }
      );

      if (subscription.notes && subscription.notes.userId) {
        const roomName = getSubscriptionRoomName(subscription.notes.userId);
        this.io.to(roomName).emit("subscription:updated", {
          type: "subscription_renewed",
          subscriptionId: subscription.id,
          newEndDate: newEndDate,
        });
      }
    }
  };

  private handleSubscriptionCancelled = async (payload: any) => {
    console.log("handleSubscriptionCancelled subscriptionService");
    const { subscription } = payload;

    const updatedSubscription =
      await this.subscriptionRepository.updateSubscriptionStatus(
        { subscriptionId: subscription.entity.id },
        {
          status: "cancelled",
          isCurrent: false,
          endDate: new Date(),
        }
      );
    if (subscription.notes && subscription.notes.userId) {
      const roomName = getSubscriptionRoomName(subscription.notes.userId);
      this.io.to(roomName).emit("subscription:updated", {
        type: "subscription_cancelled",
        subscriptionId: subscription.id,
      });
    }
  };

  private handlePaymentAuthorized = async (payload: any) => {
    console.log("handlePaymentAuthorized subscriptionService");
    const { payment } = payload;
    // Implement your logic for handling payment authorization
    // console.log("Payment authorized:", payment);
    // You might want to update the subscription status or notify the user
  };
}

export default SubscriptionServices;
