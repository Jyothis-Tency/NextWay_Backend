import mongoose, { Schema } from "mongoose";
import { IUser } from "../Interfaces/common_interface";

const userSchema = new Schema<IUser>(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },

    isBlocked: { type: Boolean, default: false },
    isSubscribed: { type: Boolean, default: false },
    dob: Date,
    gender: String,
    location: String,
    lastLogin: Date,
    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
    },

    // Embedded details
    preferredLocation: String,
    preferredRoles: [String],
    salaryExpectation: Number,
    remoteWork: Boolean,
    willingToRelocate: Boolean,
    resume: String,
    profileImage: String,
    bio: String,
    skills: [String],
    proficiency: [{ skill: String, level: String }],
    experience: [
      {
        jobTitle: String,
        company: String,
        location: String,
        startDate: Date,
        endDate: Date,
        responsibilities: [String],
        reasonForLeaving: String,
      },
    ],
    education: [
      {
        degree: String,
        institution: String,
        fieldOfStudy: String,
        startDate: Date,
        endDate: Date,
      },
    ],
    certifications: [String],
    languages: [{ language: String, proficiency: String }],
    portfolioLink: String,
    jobAlerts: [String],
  },
  { timestamps: true }
);

const User = mongoose.model<IUser>("User", userSchema);

export default User