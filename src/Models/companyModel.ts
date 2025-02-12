import mongoose, { Schema } from "mongoose";
import { ICompany } from "../Interfaces/common_interface";

const companySchema = new Schema<ICompany>(
  {
    // Account details
    company_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      unique: true,
    },
    googleId: { type: String },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String, default: "company" },
    profileImage: String,
    certificate: String,
    isVerified: {
      type: String,
      enum: ["accept", "reject", "pending"],
      default: "pending",
    },
    // Company-specific details
    name: { type: String, required: true },
    description: String,
    industry: String,
    companySize: Number,
    location: String,
    website: String,
    socialLinks: {
      linkedin: String,
      twitter: String,
      facebook: String,
    },

    employees: [
      {
        employeeId: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        role: { type: String, required: true }, // e.g., "CEO", "HR", "Developer"
      },
    ],
    logo: String,
    images: [String],
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    jobPosts: [{ type: Schema.Types.ObjectId, ref: "JobPost" }],

    // Other fields
    isBlocked: { type: Boolean, default: false },
    lastLogin: Date,
  },
  { timestamps: true }
);

const Company = mongoose.model<ICompany>("Company", companySchema);

export default Company;
