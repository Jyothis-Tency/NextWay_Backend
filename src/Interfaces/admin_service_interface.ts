import { ICompany, ISubscriptionPlan, IUser } from "./common_interface";

export interface IAdminServices {
  loginAdmin(
    email: string,
    password: string
  ): { email: string; adminAccessToken: string; adminRefreshToken: string };

  fetchAllUserDetails(): Promise<IUser[] | null>;
  fetchAllCompanyDetails(): Promise<ICompany[] | null>;
  userBlockOrUnBlock(user_id: string): Promise<IUser | null>;
  companyBlockOrUnBlock(company_id: string): Promise<ICompany | null>;
  getSubscriptionPlans(
    plan_id: string
  ): Promise<ISubscriptionPlan | ISubscriptionPlan[]>;
  createNewSubscriptionPlan(planData: ISubscriptionPlan): Promise<boolean>;
  editSubscriptionPlan(planData: ISubscriptionPlan): Promise<boolean>;
}
