import mongoose, { Schema } from "mongoose";
import {

  ISubscriptionHistory,
} from "../Interfaces/common_interface";
const SubscriptionHistorySchema = new Schema<ISubscriptionHistory>({
  user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
  plan_id: {
    type: Schema.Types.ObjectId,
    ref: "SubscriptionPlan",
    required: true,
  },
  planName: { type: String, required: true },
  createdType: { type: String, enum: ["new", "renewed"], default: "new" },
  period: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  price: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});

const SubscriptionHistory = mongoose.model<ISubscriptionHistory>(
  "SubscriptionHistory",
  SubscriptionHistorySchema
);

export default SubscriptionHistory;