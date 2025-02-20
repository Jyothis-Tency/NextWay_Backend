import { Request, Response, NextFunction } from "express";
import HttpStatusCode from "../Enums/httpStatusCodes";
import { ISubscriptionServices } from "../Interfaces/subscription_service_interface";

class SubscriptionController {
  private subscriptionService: ISubscriptionServices;

  constructor(subscriptionService: ISubscriptionServices) {
    this.subscriptionService = subscriptionService;
  }

  /**
   * Initializes a new subscription for a user
   * @param req Request containing userId and planId in body.data
   * @param res Response with subscription details
   * @param next Next function for error handling
   */
  initializeSubscription = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      console.log(req.body);
      const { userId, planId } = req.body.data;
      const subscription =
        await this.subscriptionService.initializeSubscription(userId, planId);

      res.status(HttpStatusCode.OK).json(subscription);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Verifies payment for subscription using Razorpay
   * @param req Request containing razorpay_payment_id, razorpay_order_id, and razorpay_signature in body
   * @param res Response with success status and subscriptionId
   * @param next Next function for error handling
   */
  verifyPayment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = JSON.parse(req.body.body);
      const { razorpay_payment_id, razorpay_order_id, razorpay_signature } =
        data;
      const result = await this.subscriptionService.verifyPayment(
        razorpay_payment_id,
        razorpay_order_id,
        razorpay_signature
      );

      res
        .status(HttpStatusCode.OK)
        .json({ success: true, subscriptionId: result });
    } catch (error) {
      console.log(error);
      next(error);
    }
  };

  /**
   * Cancels an active subscription
   * @param req Request containing subscriptionId in params
   * @param res Response confirming subscription cancellation
   * @param next Next function for error handling
   */
  cancelSubscription = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { subscriptionId } = req.params;
      const result = await this.subscriptionService.cancelSubscription(
        subscriptionId
      );

      res
        .status(HttpStatusCode.OK)
        .json({ message: "Subscription cancelled successfully" });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Retrieves all subscription records
   * @param req Request object
   * @param res Response with all subscriptions
   * @param next Next function for error handling
   */
  getAllSubscriptions = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    console.log("Get all subscriptions");
    try {
      const subscriptions =
        await this.subscriptionService.getAllSubscriptions();
      res.status(HttpStatusCode.OK).json(subscriptions);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Handles Razorpay webhook events for subscription updates
   * @param req Request containing event, payload and razorpay signature in headers
   * @param res Response confirming webhook receipt
   * @param next Next function for error handling
   */
  webHookController = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      console.log("WebhookController received");

      const { event, payload } = req.body;
      const signature = req.headers["x-razorpay-signature"] as string;
      await this.subscriptionService.webHookService(
        event,
        payload,
        signature,
        req.body
      );
      res.status(HttpStatusCode.OK).json({ received: true });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Retrieves details of a specific subscription plan
   * @param req Request containing plan_id in body
   * @param res Response with plan details
   * @param next Next function for error handling
   */
  getSubscriptionPlan = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const plan_id = req.body.plan_id;

      const result = await this.subscriptionService.getSubscriptionPlans(
        plan_id
      );

      if (result) {
        res.status(HttpStatusCode.OK).json({ planData: result });
      }
    } catch (error) {
      console.log(`Error in emailValidation at userController : ${error}`);
      next(error);
    }
  };

  /**
   * Retrieves subscription history for a specific user
   * @param req Request containing userId in params
   * @param res Response with user's subscription history
   * @param next Next function for error handling
   */
  getSubscriptionHistory = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const user_id = req.params.userId;
      const history = await this.subscriptionService.getSubscriptionHistory(
        user_id
      );
      if (history) {
        res.status(HttpStatusCode.OK).json({ history });
      }
    } catch (error) {
      next(error);
    }
  };

  /**
   * Fetches details of user's current active subscription
   * @param req Request containing userId in params
   * @param res Response with current subscription details
   * @param next Next function for error handling
   */
  getCurrentSubscriptionDetail = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      console.log("getCurrentSubscriptionDetails in subscriptionController");

      const user_id = req.params.userId;
      const current =
        await this.subscriptionService.getCurrentSubscriptionDetail(user_id);
      console.log("current", current);

      res.status(HttpStatusCode.OK).json({ current: current });
    } catch (error) {
      next(error);
    }
  };
}

export default SubscriptionController;
