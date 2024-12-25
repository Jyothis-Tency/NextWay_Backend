import cron from "node-cron";
import SubscriptionDetails from "../Models/subscriptionDetails";
import User from "../Models/userModel";

cron.schedule("0 0 * * *", async () => {
  try {
    console.log("Running subscription expiration check...");

    // Find expired subscriptions
    const expiredSubscriptions = await SubscriptionDetails.find({
      endDate: { $lt: new Date() },
      isCurrent: true,
    });

    // Update each subscription and its associated user
    for (const subscription of expiredSubscriptions) {
      await SubscriptionDetails.updateOne(
        { _id: subscription._id },
        { $set: { isCurrent: false, status: "expired" } }
      );

      await User.updateOne(
        { _id: subscription.user_id }, // Assuming you have userId in subscription
        { $set: { isSubscribed: false } }
      );
    }

    console.log(
      `Updated ${expiredSubscriptions.length} subscriptions to expired.`
    );
  } catch (error) {
    console.error("Error in subscription expiration check:", error);
  }
});
