import {
  ICleanCompanyData,
  ICompany,
  IJobPost,
  IJobApplication,
} from "./common_interface";

export interface ICompanyServices {
  registerCompany(companyData: ICompany): Promise<boolean>;
  otpVerification(email: string, receivedOTP: string): Promise<boolean>;
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
  forgotPasswordOTP(email: string, receivedOTP: string): Promise<boolean>;
  forgotPasswordReset(email: string, password: string): Promise<boolean>;
  getCompanyDetails(company_id: string): Promise<{
    companyProfile: ICompany;
    imgBuffer: Buffer | null;
  }>;
  editCompanyDetails(
    company_id: string,
    companyData: Partial<ICompany>
  ): Promise<boolean>;
  createOrUpdateJobPost(jobPostData: IJobPost): Promise<boolean>;
  jobPostsByCompanyId(company_id: string): Promise<IJobPost[]>;
  getJobPostByJobId(_id: string): Promise<IJobPost | null>;
  deleteJobPostById(_id: string): Promise<boolean>;
  getJobApplicationsByCompanyId(company_id: string): Promise<IJobApplication[]>;
  updateProfileImg(company_id: string, image: any): Promise<boolean>;
  getJobApplicationsByJobId(jobId: string): Promise<IJobApplication[]>;
  updateApplicationStatus(
    applicationId: string,
    status: string
  ): Promise<boolean>;
  getJobApplicationById(applicationId: string): Promise<IJobApplication | null>;
  searchCompany(query: string): Promise<ICompany[]>
}
