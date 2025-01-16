import mongoose, { Schema } from "mongoose";
import { IJobPost } from "../Interfaces/common_interface";

const jobPostSchema = new Schema<IJobPost>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    location: String,
    employmentType: {
      type: String,
      enum: ["Full-time", "Part-time", "Contract", "Internship"],
    },
    salaryRange: {
      min: Number,
      max: Number,
    },
    requirements: [String],
    responsibilities: [String],
    perks: [String],
    jobApplications: [{ type: Schema.Types.ObjectId, ref: "JobApplication" }],
    company_id: {
      type: String,
      required: true,
      ref: "Company",
    },
    status: {
      type: String,
      enum: ["open", "closed", "paused"],
      default: "open",
    },
    applicants: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

const JobPost = mongoose.model<IJobPost>("JobPost", jobPostSchema);

export default JobPost;
