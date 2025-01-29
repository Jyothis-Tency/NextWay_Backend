import express, { Router } from "express";

import SubscriptionPlan from "../Models/subscriptionPlanModel";
import SubscriptionDetails from "../Models/subscriptionDetails";


import SubscriptionRepository from "../Repository/subscriptionRepository";
import UserRepository from "../Repository/userRepository";
import SubscriptionServices from "../Services/subscriptionService";
import SubscriptionController from "../Controllers/subscriptionController";
import User from "../Models/userModel";
import Company from "../Models/companyModel";
import JobApplication from "../Models/jobApplicationModel";
import JobPost from "../Models/jobPostModel";
import { getSocketInstance } from "../Config/socketConfig";
import SubscriptionHistory from "../Models/SubscriptionHistory";

const subscriptionRepository = new SubscriptionRepository(
  SubscriptionPlan,
  SubscriptionDetails,
  SubscriptionHistory
);
const userRepository = new UserRepository(
  User,
  Company,
  JobApplication,
  SubscriptionDetails,
  SubscriptionPlan,
  JobPost,
  SubscriptionHistory
);
const subscriptionServices = new SubscriptionServices(
  subscriptionRepository,
  userRepository,
  getSocketInstance()
);
const subscriptionController = new SubscriptionController(subscriptionServices);

const subscriptionRoutes = Router();

subscriptionRoutes
  .post("/initialize", subscriptionController.initializeSubscription)
  .post("/verify", subscriptionController.verifyPayment)
  .delete("/cancel/:subscriptionId", subscriptionController.cancelSubscription)
  .get("/all-Subscriptions", subscriptionController.getAllSubscriptions)
  .post(
    "/webhook",
    // express.raw({ type: "application/json" }),
    subscriptionController.webHookController
  );

export default subscriptionRoutes;
