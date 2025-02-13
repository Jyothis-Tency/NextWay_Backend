import {
  ICleanUserData,
  IUser,
  IJobPost,
  ICompany,
  IJobApplication,
  RazorpayOrder,
  ISubscriptionDetails,
  ISubscriptionPlan,
} from "./common_interface";

export interface IUserServices {
  registerUser(userData: IUser): Promise<boolean>;
  handleGoogleAuth(token: string): Promise<Partial<ICleanUserData>>;
  otpVerification(email: string, receivedOTP: string): Promise<Boolean>;
  resentOtp(email: string): Promise<boolean>;
  loginUser(
    email: string,
    password: string
  ): Promise<{
    userData: ICleanUserData;
    accessToken: string;
    refreshToken: string;
  }>;
  forgotPasswordEmail(email: string): Promise<boolean>;
  forgotPasswordOTP(email: string, receivedOTP: string): Promise<Boolean>;
  forgotPasswordReset(email: string, password: string): Promise<Boolean>;
  getAllJobPosts(): Promise<{ jobPosts: IJobPost[]; companies: ICompany[] }>;
  // getAllJobPostService(): Promise<any>;
  // getAllCompanyService(): Promise<any>;
  getUserProfile(userId: string): Promise<any>;
  editUserDetailsService(
    user_id: string,
    userData: Partial<IUser>
  ): Promise<IUser>;
  newJobApplication(
    applicationData: IJobApplication,
    resumeFile: any
  ): Promise<IJobApplication>;
  updateProfileImg(user_id: string, image: any): Promise<boolean>;

  getSubscriptionHistory(user_id: string): Promise<ISubscriptionDetails[]>;
  getCurrentSubscriptionDetail(
    user_id: string
  ): Promise<ISubscriptionDetails | null>;
  getJobApplicationsByUserId(user_id: string): Promise<IJobApplication[]>;
  searchCompany(query: string): Promise<ICompany[]>;
  getAllCompanyProfileImages(): Promise<
    {
      company_id: string;
      profileImage: string;
    }[]
  >;
  fetchAllCompanyDetails(): Promise<ICompany[] | null>;
  getSubscriptionPlans(
    plan_id: string
  ): Promise<ISubscriptionPlan | ISubscriptionPlan[]>;
  getCompanyDetails(company_id: string): Promise<any>;
}
