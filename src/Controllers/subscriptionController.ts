import { Request, Response, NextFunction } from "express";
import HttpStatusCode from "../Enums/httpStatusCodes";
import { ISubscriptionServices } from "../Interfaces/subscription_service_interface";

class SubscriptionController {
  private subscriptionService: ISubscriptionServices;

  constructor(subscriptionService: ISubscriptionServices) {
    this.subscriptionService = subscriptionService;
  }

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
