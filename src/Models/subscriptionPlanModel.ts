import mongoose, { Schema } from "mongoose";
import { ISubscriptionPlan } from "../Interfaces/common_interface";

const SubscriptionPlanSchema = new Schema<ISubscriptionPlan>({
  name: { type: String, required: true, unique: true },
  price: { type: Number, required: true },
  period: {
    type: String,
    
    enum: ["daily", "weekly", "monthly", "yearly"],
    required: true,
  },
  duration: { type: Number },
  features: [{ type: String }],
  razorpayPlanId: { type: String },
  createdAt: { type: Date, default: Date.now() },
});

SubscriptionPlanSchema.index({ name: 1, price: 1 }, { unique: true });

const SubscriptionPlan = mongoose.model<ISubscriptionPlan>(
  "SubscriptionPlan",
  SubscriptionPlanSchema
);

export default SubscriptionPlan;
