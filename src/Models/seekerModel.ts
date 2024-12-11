import mongoose, { Schema } from "mongoose";
import { ISeeker } from "../Interfaces/common_interface";

const seekerSchema = new Schema<ISeeker>(
  {
    seeker_id: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },
    profilePicture: String,
    isBlocked: { type: Boolean, default: false },
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

const Seeker = mongoose.model<ISeeker>("Seeker", seekerSchema);

export default Seeker