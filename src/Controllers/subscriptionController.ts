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
      const { razorpay_payment_id, razorpay_order_id, razorpay_signature } =
        req.body;
      const result = await this.subscriptionService.verifyPayment(
        razorpay_payment_id,
        razorpay_order_id,
        razorpay_signature
      );

      res
        .status(HttpStatusCode.OK)
        .json({ success: true, subscriptionId: result });
    } catch (error) {
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
}

export default SubscriptionController;
