import mongoose, { Schema } from "mongoose";
import { IRecruiter } from "../Interfaces/common_interface";

const recruiterSchema = new Schema<IRecruiter>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },
    profilePicture: String,
    isBlocked: { type: Boolean, default: false },
    lastLogin: Date,
    company: { type: Schema.Types.ObjectId, ref: "Company" },
  },
  { timestamps: true }
);

export const Recruiter = mongoose.model<IRecruiter>(
  "Recruiter",
  recruiterSchema
);