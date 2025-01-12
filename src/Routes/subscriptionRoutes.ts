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

const subscriptionRepository = new SubscriptionRepository(
  SubscriptionPlan,
  SubscriptionDetails
);
const userRepository = new UserRepository(
  User,
  Company,
  JobApplication,
  SubscriptionDetails,
  SubscriptionPlan
);
const subscriptionServices = new SubscriptionServices(
  subscriptionRepository,
  userRepository
);
const subscriptionController = new SubscriptionController(subscriptionServices);

const subscriptionRoutes = Router();

subscriptionRoutes.post(
  "/initialize",
  subscriptionController.initializeSubscription
);

subscriptionRoutes.post("/verify", subscriptionController.verifyPayment);

subscriptionRoutes.delete(
  "/cancel/:subscriptionId",
  subscriptionController.cancelSubscription
);

subscriptionRoutes.post(
  "/webhook",
  // express.raw({ type: "application/json" }),
  subscriptionController.webHookController
);

export default subscriptionRoutes;
