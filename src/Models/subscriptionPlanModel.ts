import mongoose, { Schema } from "mongoose";
import { ISubscriptionPlan } from "../Interfaces/common_interface";

const SubscriptionPlanSchema = new Schema<ISubscriptionPlan>({
  name: { type: String, required: true, unique: true },
  price: { type: Number, required: true },
  duration: { type: Number, required: true },
  features: [{ type: String }],
  createdAt: { type: Date, default: Date.now() },
});

SubscriptionPlanSchema.index({ name: 1, price: 1 }, { unique: true });

const SubscriptionPlan = mongoose.model<ISubscriptionPlan>(
  "SubscriptionPlan",
  SubscriptionPlanSchema
);

export default SubscriptionPlan;
