import { IJobPost, ICompany, ICleanCompanyData, IJobApplication } from "./common_interface";

export interface ICompanyServices {
  registerCompany(companyData: ICompany): Promise<boolean>;
  otpVerification(email: string, receivedOTP: string): Promise<Boolean>;
  resentOtp(email: string): Promise<boolean>;
  loginCompany(
    email: string,
    password: string
  ): Promise<{
    companyData: ICleanCompanyData;
    accessToken: string;
    refreshToken: string;
  }>;
  forgotPasswordEmail(email: string): Promise<boolean>;
  forgotPasswordOTP(email: string, receivedOTP: string): Promise<Boolean>;
  forgotPasswordReset(email: string, password: string): Promise<Boolean>;

  getCompanyDetails(company_id: string): Promise<ICompany | null>;
  editCompanyDetails(
    company_id: string,
    companyData: Partial<ICompany>
  ): Promise<boolean>;
  createOrUpdateJobPost(jobPostData: IJobPost): Promise<boolean>;
  jobPostsByCompanyId(company_id: string): Promise<IJobPost[] | null>;
  getJobPostByJobId(_id: string): Promise<IJobPost | null>;
  deleteJobPostById(_id: string): Promise<boolean>;
  getJobApplicationsByCompanyId(company_id: string): Promise<IJobApplication[]>;
  // newJobPost(jobData: IJobPost, userId: string): Promise<boolean>;
  // allJobPost(userId: String): Promise<IJobPost[]>;
  // newCompany(companyData: ICompany, userId: string): Promise<boolean>;
  // getCompanyDetails(userId: string): Promise<ICompany | null>;
}
