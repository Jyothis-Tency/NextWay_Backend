import { UpdateResult } from "mongoose";
import {
  IJobApplication,
  ISubscriptionDetails,
  ISubscriptionPlan,
  IUser,
} from "./common_interface";
import { IJobPost } from "./common_interface";
import { ICompany } from "./common_interface";

export interface IUserRepository {
  findByEmail(email: string): Promise<IUser | null>;
  // authenticate(email: string, password: string): Promise<IUser | null>;
  register(userData: IUser): Promise<IUser>;
  updatePassword(userId: string, newPassword: string): Promise<IUser | null>;
  getUserById(userId: string): Promise<IUser | null>;
  getAllCompaniesByIds(company_id: string[]): Promise<ICompany[]>;
  putUserById(user_id: string, userData: Partial<IUser>): Promise<IUser>;
  postJobApplication(
    applicationData: IJobApplication
  ): Promise<IJobApplication>;
  postProfileImg(user_id: string, url: string): Promise<boolean>;
  getSubscriptionHistory(user_id: string): Promise<ISubscriptionDetails[]>;
  getCurrentSubscriptionDetails(
    user_id: string
  ): Promise<ISubscriptionDetails | null>;
  getJobApplicationsByUserId(user_id: string): Promise<IJobApplication[]>;
  searchByUserName(name: string): Promise<IUser[]>;
}
