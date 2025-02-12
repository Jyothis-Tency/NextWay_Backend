import { UpdateResult } from "mongoose";
import { ICompany, IUser, ISubscriptionPlan, IAdmin } from "./common_interface";

export interface IAdminRepository {
  findAdmin(email: string): Promise<IAdmin | null>;
  getAllUsers(): Promise<IUser[] | null>;
  getAllCompanies(): Promise<ICompany[] | null>;
  toggleCompanyBlock(company_id: string): Promise<ICompany | null>;
  toggleUserBlock(user_id: string): Promise<IUser | null>;
  getSubscriptionPlans(
    plan_id: string
  ): Promise<ISubscriptionPlan | ISubscriptionPlan[]>;
  createSubscriptionPlan(
    planData: ISubscriptionPlan
  ): Promise<ISubscriptionPlan>;
  editSubscriptionPlan(planData: ISubscriptionPlan): Promise<UpdateResult>;
}
