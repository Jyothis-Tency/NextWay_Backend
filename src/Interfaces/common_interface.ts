import mongoose, { Document, ObjectId } from "mongoose";

export interface ISubscriptionPlan extends Document {
  name: string;
  price: number;
  duration: number;
  features: string[];
  createdAt: Date;
}

export interface IUser extends Document {
  user_id: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  isBlocked?: boolean;
  isSubscribed?: boolean;
  dob?: Date;
  gender?: string;
  location?: string;
  lastLogin?: Date;
  status?: "active" | "inactive" | "suspended";

  preferredLocation?: string;
  preferredRoles?: string[];
  salaryExpectation?: number;
  remoteWork?: boolean;
  willingToRelocate?: boolean;

  resume?: string;
  profileImage?: string;
  bio?: string;
  skills?: string[];
  proficiency?: { skill: string; level: string }[];
  experience?: {
    jobTitle: string;
    company: string;
    location: string;
    startDate: Date;
    endDate?: Date;
    responsibilities?: string[];
    reasonForLeaving?: string;
  }[];
  education?: {
    degree: string;
    institution: string;
    fieldOfStudy: string;
    startDate: Date;
    endDate?: Date;
  }[];
  certifications?: string[];
  languages?: { language: string; proficiency: string }[];
  portfolioLink?: string;
  jobAlerts?: string[];
}

export interface IRecruiter extends Document {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  profilePicture?: string;
  isBlocked?: boolean;
  lastLogin?: Date;
  company: mongoose.Types.ObjectId; // Reference to Company
}

export interface IEmployee {
  employeeId: mongoose.Types.ObjectId; // Reference to User
  role: string; // Role in the company (e.g., CEO, HR)
}

export interface ICompany extends Document {
  company_id: mongoose.Types.ObjectId; // Unique identifier for the company
  name: string; // Company name
  email: string; // Company account email
  phone: string; // Company account phone number
  password: string; // Company account password
  isBlocked: boolean;
  profileImage?: string; // Optional profile picture URL

  description?: string; // Optional company description
  industry?: string; // Optional industry type
  companySize?: number; // Optional number of employees
  location?: string; // Optional location
  website?: string; // Optional website URL
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
  };
  employees?: IEmployee[]; // List of employees with roles
  logo?: string; // Optional company logo
  images?: string[]; // Optional array of company-related image URLs
  status?: "pending" | "approved" | "rejected"; // Approval status
  jobPosts?: mongoose.Types.ObjectId[]; // References to job posts

  lastLogin?: Date; // Last login timestamp
}

export interface IJobPost extends Document {
  title: string;
  description: string;
  location?: string;
  employmentType?: "Full-time" | "Part-time" | "Contract" | "Internship";
  salaryRange?: { min: number; max: number };
  requirements?: string[];
  jobApplications?: mongoose.Types.ObjectId[];
  responsibilities?: string[];
  perks?: string[];
  postedBy: mongoose.Types.ObjectId; // Reference to Recruiter
  company_id: string; // Reference to Company
  applicants?: mongoose.Types.ObjectId[]; // References JobApplication IDs
  status?: "open" | "closed" | "paused";
}

export interface IJobApplication extends Document {
  job_id: mongoose.Types.ObjectId;
  user_id: string;
  company_id: string;
  firstName: string;
  lastName: string;
  email: string;
  location?: string;
  phone?: string;
  resume: string; // URL to the resume file
  coverLetter?: string; // Optional cover letter text
  status: "Pending" | "Viewed" | "Shortlisted" | "Rejected" | "Hired";
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ISubscriptionDetails {
  user_id: mongoose.Types.ObjectId; // Reference to the User model
  plan_id: mongoose.Types.ObjectId; // Reference to the SubscriptionPlan model
  planName: string; // Name of the subscription plan
  startDate: Date;
  features: string[]; // Start date of the subscription
  endDate: Date; // End date of the subscription
  price: number; // Price of the subscription
  paymentId: string; // Payment identifier
  status: "active" | "expired" | "cancelled"; // Status of the subscription
  isCurrent?: boolean; // Indicates if this is the user's current subscription
  createdAt?: Date; // Timestamp when the subscription record was created
}

export interface ISubscriptionHistory extends Document {
  user_id: mongoose.Types.ObjectId; // Reference to the User
  plan_id: mongoose.Types.ObjectId; // Reference to the Subscription Plan
  planName: string; // Redundant storage for ease of querying
  startDate: Date;
  endDate: Date;
  price: number;
  paymentId: string; // Razorpay or other payment gateway ID
  status: "active" | "expired" | "cancelled";
}

export interface RazorpayOrder {
  id: string;
  entity: string;
  amount: number | string;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string | undefined;
  status: "created" | "attempted" | "paid";
  attempts: number;
  created_at: number;
}

export interface RazorpayOrderReceipt {
  receipt_id: string;
  receipt_number: string;
}

export interface IFile extends Document {
  filePath: string;
  uploadedAt: Date;
}

export interface IUploadFileRequest {
  file: Express.Multer.File;
}

// export interface ICompany extends Document {
//   user_id: string;
//   name: string; // Company name
//   website: string; // Company website URL
//   logo: string; // Company logo URL
//   industry: string; // Industry category (e.g., IT, Healthcare)
//   size: "1-50" | "51-200" | "201-500" | "501-1000" | "1000+"; // Number of employees
//   jobPosts: (ObjectId | string)[];
//   headquarters: string; // Headquarters location
//   description: string; // Short company description
//   establishedYear: number; // Year company was founded
//   benefits: string[]; // Benefits offered by the company
//   rating: { average: number; count: number }; // Average rating and number of reviews
//   socialLinks: { linkedin?: string; twitter?: string; facebook?: string }; // Social media links
//   featured: boolean; // Whether the company is featured on the platform
//   jobsPosted: mongoose.Types.ObjectId[]; // List of job IDs posted by the company
//   employees: { userId: mongoose.Types.ObjectId; role: string }[]; // Key employees and their roles
//   images: string[]; // URLs of company-related images
//   verified: boolean; // Whether the company profile is verified
//   createdAt: Date; // Profile creation date
//   updatedAt: Date; // Last update date
// }

// export interface ISeekerData {
//   bio?: string;
//   resume?: string;
//   skills: string[];
//   proficiency: { skill: string; level: string }[];
//   experience: {
//     jobTitle: string;
//     company: string;
//     location: string;
//     startDate: Date;
//     endDate: Date;
//     responsibilities: string[];
//     reasonForLeaving?: string;
//   }[];
//   education: {
//     degree: string;
//     institution: string;
//     fieldOfStudy: string;
//     startDate: Date;
//     endDate: Date;
//   }[];
//   certifications: string[];
//   languages: {
//     language: string;
//     proficiency: string;
//   }[];
//   portfolioLink?: string;
//   jobPreferences: {
//     preferredLocation?: string;
//     preferredRoles: string[];
//     salaryExpectation: number;
//     remoteWork: boolean;
//     willingToRelocate: boolean;
//   };
//   jobAlerts: string[];
// }

// export interface IRecruiterData {
//   companyName: string;
//   companyLogo?: string;
//   companyDescription: string;
//   industry: string;
//   companyLocation: string;
//   website: string;
//   socialLinks: {
//     linkedin?: string;
//     twitter?: string;
//     facebook?: string;
//   };
// }

// export interface IJobPost extends Document {
//   title: string;
//   description: string;
//   skillsRequired: string[];
//   employmentType:
//     | "Full-Time"
//     | "Part-Time"
//     | "Contract"
//     | "Internship"
//     | "Freelance";
//   experienceLevel: "Entry" | "Mid" | "Senior" | "Director";
//   educationRequired: string;
//   jobFunction: string;
//   keywords: string[];
//   salaryRange: { min: number; max: number };
//   location: string;
//   remote: boolean;
//   benefits: string[];
//   applicationDeadline: Date;
//   jobStatus: "open" | "closed" | "draft";
//   postedBy: string;
//   company: mongoose.Types.ObjectId;
//   createdAt: Date;
//   updatedAt: Date;
//   active: boolean;
//   applications: number;
// }

export interface ICleanUserData {
  user_id: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  isBlocked: boolean | undefined;
}

export interface ICleanCompanyData {
  company_id: mongoose.Types.ObjectId; // Unique identifier for the company
  name: string;
  email: string; // Company account email
  phone: string; // Company account phone number
  isBlocked: boolean | undefined;
}
