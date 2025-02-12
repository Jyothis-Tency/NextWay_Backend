import {
  IAdmin,
  ICompany,
  IJobPost,
  ISubscriptionPlan,
  IUser,
  ICleanAdminData,
} from "./common_interface";

export interface IAdminServices {
  loginAdmin(
    email: string,
    password: string
  ): Promise<{
    adminData: ICleanAdminData;
    accessToken: string;
    refreshToken: string;
  }>;

  fetchAllUserDetails(): Promise<IUser[] | null>;
  fetchAllCompanyDetails(): Promise<ICompany[] | null>;
  userBlockOrUnBlock(user_id: string): Promise<IUser | null>;
  companyBlockOrUnBlock(company_id: string): Promise<ICompany | null>;
  getSubscriptionPlans(
    plan_id: string
  ): Promise<ISubscriptionPlan | ISubscriptionPlan[]>;
  createNewSubscriptionPlan(planData: ISubscriptionPlan): Promise<boolean>;
  editSubscriptionPlan(planData: ISubscriptionPlan): Promise<boolean>;
  getAllUserProfileImages(): Promise<
    {
      user_id: string;
      profileImage: string;
    }[]
  >;
  getAllCompanyProfileImages(): Promise<
    {
      company_id: string;
      profileImage: string;
    }[]
  >;
  getAllJobPosts(): Promise<{
    jobPosts: IJobPost[];
    companies: ICompany[];
  }>;
  getCompanyDetails(company_id: string): Promise<any>;
  getUserDetails(user_id: string): Promise<any>;
   changeVerificationStatus  (
    company_id: string,
    newStatus: string
  ): Promise<string | null>
}
