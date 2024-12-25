import mongoose, { Schema } from "mongoose";
import { ISubscriptionDetails } from "../Interfaces/common_interface";

const SubscriptionDetailsSchema = new Schema<ISubscriptionDetails>({
  user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
  plan_id: {
    type: Schema.Types.ObjectId,
    ref: "SubscriptionPlan",
    required: true,
  },
  planName: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  price: { type: Number, required: true },
  features: [{ type: String }],
  paymentId: { type: String, required: true },
  status: {
    type: String,
    enum: ["active", "expired", "cancelled"],
    required: true,
  },
  isCurrent: { type: Boolean, default: false }, // Indicates if this is the user's current subscription
  createdAt: { type: Date, default: Date.now },
});

const SubscriptionDetails = mongoose.model<ISubscriptionDetails>(
  "SubscriptionDetails",
  SubscriptionDetailsSchema
);

export default SubscriptionDetails;
