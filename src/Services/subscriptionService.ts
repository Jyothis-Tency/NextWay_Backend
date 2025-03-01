import razorpayInstance from "../Config/razorpayConfig";
import HttpStatusCode from "../Enums/httpStatusCodes";
import dayjs from "dayjs";
import {
  ISubscriptionDetails,
  IOrderResponse,
  ISubscriptionPlan,
  ISubscriptionHistory,
} from "../Interfaces/common_interface";
import { ISubscriptionRepository } from "../Interfaces/subscription_repository_interface";
import { IUserRepository } from "../Interfaces/user_repository_interface";
import { ISubscriptionServices } from "../Interfaces/subscription_service_interface";
import CustomError from "../Utils/customError";
import dotenv from "dotenv";
import crypto from "crypto";
import SubscriptionPeriods from "../Enums/SubscriptionPeriods";
import { ObjectId } from "mongodb";
import { getSubscriptionRoomName } from "../Config/socketConfig";
import { Server } from "socket.io";
import { RazorpayPayload } from "../Interfaces/common_interface";

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
    } catch (error: unknown) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in subscription initializeSubscription: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
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
          "secret not contains value",
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
    } catch (error: unknown) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in subscription verifyPayment: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  getAllSubscriptions = async (): Promise<ISubscriptionDetails[]> => {
    try {
      console.log("getAllSubscriptions subscriptionService");

      return await this.subscriptionRepository.findAllSubscriptions();
    } catch (error: unknown) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in subscription getAllSubscriptions: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  webHookService = async (
    event: string,
    payload: RazorpayPayload,
    signature: string,
    body: string
  ): Promise<boolean> => {
    try {
      console.log("WebhookService");

      const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
      if (!secret) {
        throw new CustomError(
          "secret not contains value",
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
    } catch (error: unknown) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in subscription webHookService: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  // New methods to handle webhook events
  private handleOrderPaid = async (payload: RazorpayPayload) => {
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

    // Deactivate current subscription
    await this.subscriptionRepository.updateSubscriptionStatus(
      { user_id: userId, isCurrent: true },
      { isCurrent: false }
    );

    // Create new subscription details
    if (!plan) {
      throw new CustomError("Plan not found", HttpStatusCode.NOT_FOUND);
    }

    const durationInDays =
      SubscriptionPeriods[plan.period as keyof typeof SubscriptionPeriods];

    if (!durationInDays) {
      throw new Error(`Invalid subscription period: ${plan.period}`);
    }

    const endDate = new Date(Date.now() + durationInDays * 24 * 60 * 60 * 1000);

    const newSubscription =
      await this.subscriptionRepository.createSubscriptionDetails({
        user_id: new ObjectId(userId),
        plan_id: new ObjectId(planId) || "",
        planName: plan.name || "Unknown Plan",
        startDate: new Date(),
        period: plan.period,
        endDate: endDate,
        price: plan.price,
        features: plan.features,
        paymentId: order.id,
        status: "active",
        isCurrent: true,
        subscriptionId: order.id,
      });

    await this.subscriptionRepository.createSubscriptionHistory({
      user_id: new ObjectId(userId),
      plan_id: new ObjectId(planId),
      planName: plan.name,
      createdType: "new",
      period: plan.period,
      startDate: new Date(),
      endDate: endDate,
      price: plan.price,
      createdAt: new Date(),
    });
    const roomName = getSubscriptionRoomName(userId);
    this.io.to(roomName).emit("subscription:updated", {
      type: "new_subscription",
      subscription: newSubscription,
    });
    await this.subscriptionRepository.updateUserIsSubscribed(
      userId,
      true,
      plan.features
    );
  };

  private handlePaymentCaptured = async (payload: RazorpayPayload) => {
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
      { paymentId: payment.entity.id },
      { status: "active" }
    );
  };

  private handlePaymentFailed = async (payload: RazorpayPayload) => {
    console.log("handlePaymentFailed subscriptionService");
    const { payment } = payload;

    // Update subscription status
    await this.subscriptionRepository.updateSubscriptionStatus(
      { paymentId: payment.entity.id },
      { status: "payment failed", isCurrent: false }
    );
  };

  private handleSubscriptionCharged = async (payload: RazorpayPayload) => {
    console.log("handleSubscriptionCharged subscriptionService");
    const { subscription } = payload;

    // Update subscription end date
    const subscriptionDetails =
      await this.subscriptionRepository.findSubscription(
        subscription.entity.id
      );

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

      const durationInDays =
        SubscriptionPeriods[plan.period as keyof typeof SubscriptionPeriods];

      if (!durationInDays) {
        throw new Error(`Invalid subscription period: ${plan.period}`);
      }

      const newEndDate = new Date(
        subscriptionDetails.endDate.getTime() +
          durationInDays * 24 * 60 * 60 * 1000
      );

      subscriptionDetails.endDate = newEndDate;
      subscriptionDetails.paymentId = subscription.entity.payment_id || ""; // Update with new payment ID
      await this.subscriptionRepository.updateSubscriptionStatus(
        { subscriptionId: subscriptionDetails.subscriptionId || "" },
        {
          endDate: subscriptionDetails.endDate,
          paymentId: subscription.entity.payment_id,
        }
      );

      await this.subscriptionRepository.createSubscriptionHistory({
        user_id: subscriptionDetails.user_id,
        plan_id: subscriptionDetails.plan_id,
        planName: subscriptionDetails.planName,
        createdType: "renewal",
        period: plan.period,
        startDate: subscriptionDetails.endDate,
        endDate: newEndDate,
        price: plan.price,
        createdAt: new Date(),
      });

      await this.subscriptionRepository.updateUserIsSubscribed(
        subscriptionDetails.user_id.toString(),
        true,
        plan.features
      );

      if (subscription.entity.notes && subscription.entity.notes.userId) {
        const roomName = getSubscriptionRoomName(
          subscription.entity.notes.userId
        );
        this.io.to(roomName).emit("subscription:updated", {
          type: "subscription_renewed",
          subscriptionId: subscription.entity.id,
          newEndDate: newEndDate,
        });
      }
    }
  };

  cancelSubscription = async (subscriptionId: string): Promise<boolean> => {
    try {
      console.log("cancelSubscription subscriptionService");
      console.log(subscriptionId);

      const subscriptionDetails =
        await this.subscriptionRepository.findSubscription(subscriptionId);
      if (!subscriptionDetails) {
        throw new CustomError(
          "Subscription not found",
          HttpStatusCode.NOT_FOUND
        );
      }
      await razorpayInstance.subscriptions.cancel(subscriptionId);
      await this.subscriptionRepository.updateUserIsSubscribed(
        subscriptionDetails.user_id.toString(),
        false,
        []
      );
      // Update subscription status in the database
      // await this.subscriptionRepository.updateSubscriptionStatus(
      //   { subscriptionId: subscriptionId },
      //   { status: "cancelled", isCurrent: false }
      // );

      // await this.subscriptionRepository.updateUserIsSubscribed(
      //   subscriptionDetails.user_id.toString(),
      //   false,
      //   []
      // );
      return true;
    } catch (error: unknown) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in subscription cancelSubscription: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  private handleSubscriptionCancelled = async (payload: RazorpayPayload) => {
    console.log("handleSubscriptionCancelled subscriptionService");
    const { subscription } = payload;
    console.log("subscription payload", subscription);

    const updatedSubscription =
      await this.subscriptionRepository.updateSubscriptionStatus(
        { subscriptionId: subscription.entity.id },
        {
          status: "cancelled",
          isCurrent: false,
          endDate: new Date(),
        }
      );
    const roomName = getSubscriptionRoomName(subscription.entity.notes.userId);
    await this.subscriptionRepository.updateUserIsSubscribed(
      subscription.entity.notes.userId,
      false,
      []
    );
    this.io.to(roomName).emit("subscription:updated", {
      type: "subscription_cancelled",
      subscriptionId: subscription.entity.id,
    });
  };

  private handlePaymentAuthorized = async (payload: RazorpayPayload) => {
    console.log("handlePaymentAuthorized subscriptionService");
    const { payment } = payload;
    // Implement your logic for handling payment authorization
    // console.log("Payment authorized:", payment);
    // You might want to update the subscription status or notify the user
  };

  getSubscriptionPlans = async (
    plan_id: string
  ): Promise<ISubscriptionPlan | ISubscriptionPlan[]> => {
    try {
      const result = await this.subscriptionRepository.getSubscriptionPlans(
        plan_id
      );
      if (!result) {
        throw new CustomError(
          "Error occurred getting subscription plan",
          HttpStatusCode.NOT_FOUND
        );
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
      const result = await this.subscriptionRepository.getSubscriptionHistory(
        user_id
      );
      if (!result || result.length === 0) {
        throw new CustomError(
          "No subscription history found",
          HttpStatusCode.NOT_FOUND
        );
      }
      return result;
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

  getCurrentSubscriptionDetail = async (
    user_id: string
  ): Promise<ISubscriptionDetails | null> => {
    try {
      const result =
        await this.subscriptionRepository.getCurrentSubscriptionDetails(
          user_id
        );
      // if (!result) {
      //   throw new CustomError(
      //     "No active subscription found",
      //     HttpStatusCode.NOT_FOUND
      //   );
      // }
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

  cancelExpiredSubscriptions = async () => {
    try {
      const today = dayjs().startOf("day").toDate();
      const expiredSubscriptions =
        await this.subscriptionRepository.getExpiredSubscriptions(today);

      for (const subscription of expiredSubscriptions) {
        await this.cancelSubscription(subscription.subscriptionId || "");
      }
      return true;
    } catch (error: unknown) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in subscription cancelExpiredSubscriptions: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };
}

export default SubscriptionServices;
