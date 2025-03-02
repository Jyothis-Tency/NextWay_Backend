import cron from "node-cron";
import SubscriptionPlan from "../Models/subscriptionPlanModel";
import SubscriptionDetails from "../Models/subscriptionDetails";
import SubscriptionRepository from "../Repository/subscriptionRepository";
import UserRepository from "../Repository/userRepository";
import SubscriptionServices from "../Services/subscriptionService";
import User from "../Models/userModel";
import Company from "../Models/companyModel";
import JobApplication from "../Models/jobApplicationModel";
import JobPost from "../Models/jobPostModel";
import { getSocketInstance } from "../Config/socketConfig";
import SubscriptionHistory from "../Models/SubscriptionHistory";
import CustomError from "./customError";
import HttpStatusCode from "../Enums/httpStatusCodes";
const subscriptionRepository = new SubscriptionRepository(
  SubscriptionPlan,
  SubscriptionDetails,
  SubscriptionHistory,
  User
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

const cronJobs = () => {
  cron.schedule("0 0 * * *", async () => {
    console.log("Running subscription cancellation job...");
    await subscriptionServices.cancelExpiredSubscriptions();
    console.log("Subscription cancellation job completed.");
  });

  cron.schedule("0 0 * * *", async () => {
    console.log("test");
  });

  console.log("Cron jobs have been scheduled");
};

export default cronJobs;
