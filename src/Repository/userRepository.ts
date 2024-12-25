import { Model, UpdateResult } from "mongoose";
import { IUserRepository } from "../Interfaces/user_repository_interface";
import {
  IUser,
  IJobPost,
  ICompany,
  IJobApplication,
  ISubscriptionDetails,
  ISubscriptionPlan,
} from "../Interfaces/common_interface";
import { ObjectId } from "mongodb";
import { Types } from "mongoose";
import Razorpay from "razorpay";
import razorpayInstance from "../Config/razorpayConfig";
import CustomError from "../Utils/customError";
import HttpStatusCode from "../Enums/httpStatusCodes";

import { application } from "express";

class UserRepository implements IUserRepository {
  private user = Model<IUser>;
  private company = Model<ICompany>;
  private jobApplication = Model<IJobApplication>;
  private subscriptionDetails = Model<ISubscriptionDetails>;
  private subscriptionPlan = Model<ISubscriptionPlan>;

  constructor(
    user: Model<IUser>,
    company: Model<ICompany>,
    jobApplication: Model<IJobApplication>,
    subscriptionDetails: Model<ISubscriptionDetails>,
    subscriptionPlan: Model<ISubscriptionPlan>
  ) {
    this.user = user;
    this.company = company;
    this.jobApplication = jobApplication;
    this.subscriptionDetails = subscriptionDetails;
    this.subscriptionPlan = subscriptionPlan;
  }

  findByEmail = async (email: string): Promise<IUser | null> => {
    try {
      const user = await this.user.findOne({ email });
      return user;
    } catch (error) {
      throw new CustomError(
        "Error finding user by email",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  // login = async (email: string): Promise<IUser> => {
  //   try {
  //     const userDetails = await this.userModel.aggregate([
  //       { $match: { email: email } },
  //     ]);
  //     return userDetails[0];
  //   } catch (error) {
  //     console.log(`Error in login at userRepository : ${error}`);
  //     throw error;
  //   }
  // };

  register = async (userData: IUser): Promise<IUser> => {
    try {
      const newUser = await this.user.create(userData);
      return newUser;
    } catch (error) {
      throw new CustomError(
        "Error registering user",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  updatePassword = async (
    email: string,
    password: string
  ): Promise<IUser | null> => {
    try {
      const updatedUser = await this.user.findOneAndUpdate(
        { email },
        { $set: { password: password } },
        { new: true }
      );
      return updatedUser;
    } catch (error) {
      throw new CustomError(
        "Error updating password",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  getUserById = async (user_id: string): Promise<IUser | null> => {
    try {
      const user = (await this.user
        .findOne({ user_id: user_id })
        .lean()) as IUser | null;
      return user;
    } catch (error) {
      throw new CustomError(
        "Error fetching user by ID",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  putUserById = async (
    user_id: string,
    userData: Partial<IUser>
  ): Promise<boolean> => {
    try {
      const updatedUser = await this.user.updateOne(
        { user_id: user_id },
        { $set: userData }
      );
      return updatedUser.modifiedCount > 0;
    } catch (error) {
      throw new CustomError(
        "Error updating user",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  getAllCompaniesByIds = async (company_id: string[]): Promise<ICompany[]> => {
    try {
      const companies = await this.company.find({
        company_id: { $in: company_id },
      });
      return companies;
    } catch (error) {
      throw new CustomError(
        "Error fetching companies",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };
  postJobApplication = async (
    applicationData: IJobApplication
  ): Promise<IJobApplication> => {
    try {
      const result = await this.jobApplication.create(applicationData);
      return result;
    } catch (error) {
      throw new CustomError(
        "Error creating job application",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  postProfileImg = async (user_id: string, url: string): Promise<boolean> => {
    try {
      const result = await this.user.updateOne(
        { user_id: user_id },
        { $set: { profileImage: url } }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      throw new CustomError(
        "Error updating profile image",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  getSubscriptionHistory = async (
    user_id: string
  ): Promise<ISubscriptionDetails[]> => {
    try {
      const subscriptionHistory = await this.subscriptionDetails.find({
        user_id: new Types.ObjectId(user_id),
      });
      return subscriptionHistory;
    } catch (error) {
      throw new CustomError(
        "Error fetching subscription history",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  getSubscriptionPlanById = async (
    plan_id: string
  ): Promise<ISubscriptionPlan | null> => {
    try {
      const subscriptionPlan = await this.subscriptionPlan.findOne({
        _id: plan_id,
      });
      return subscriptionPlan;
    } catch (error) {
      throw new CustomError(
        "Error fetching subscription plan",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  deactivateUserSubscriptions = async (
    user_id: string
  ): Promise<UpdateResult> => {
    try {
      const result = await this.subscriptionDetails.updateMany(
        { user_id: new Types.ObjectId(user_id) },
        { $set: { isCurrent: false } }
      );
      return result;
    } catch (error) {
      throw new CustomError(
        "Error deactivating subscriptions",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  createSubscription = async (
    subscriptionDetails: ISubscriptionDetails
  ): Promise<ISubscriptionDetails> => {
    try {
      const result = await this.subscriptionDetails.create(subscriptionDetails);
      await this.user.updateOne(
        { user_id: subscriptionDetails.user_id },
        { $set: { isSubscribed: true } }
      );
      return result;
    } catch (error) {
      throw new CustomError(
        "Error creating subscription",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  getCurrentSubscriptionDetails = async (
    user_id: string
  ): Promise<ISubscriptionDetails | null> => {
    try {
      const result = await this.subscriptionDetails.findOne({
        user_id: user_id,
        isCurrent: true,
      });
      return result;
    } catch (error) {
      throw new CustomError(
        "Error fetching current subscription",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  getJobApplicationsByUserId = async (
    user_id: string
  ): Promise<IJobApplication[]> => {
    try {
      return await this.jobApplication.find({ user_id: user_id });
    } catch (error) {
      throw new CustomError(
        "Error fetching job applications",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };
}

export default UserRepository;
