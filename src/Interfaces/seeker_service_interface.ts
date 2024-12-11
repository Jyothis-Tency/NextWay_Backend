import {
  ICleanSeekerData,
  ISeeker,
  IJobPost,
  ICompany,
  IJobApplication,
} from "./common_interface";

export interface ISeekerServices {
  registerSeeker(seekerData: ISeeker): Promise<boolean>;
  otpVerification(email: string, receivedOTP: string): Promise<Boolean>;
  resentOtp(email: string): Promise<boolean>;
  loginSeeker(
    email: string,
    password: string
  ): Promise<{
    seekerData: ICleanSeekerData;
    accessToken: string;
    refreshToken: string;
  }>;
  forgotPasswordEmail(email: string): Promise<boolean>;
  forgotPasswordOTP(email: string, receivedOTP: string): Promise<Boolean>;
  forgotPasswordReset(email: string, password: string): Promise<Boolean>;
  getAllJobPosts(): Promise<{ jobPosts: IJobPost[]; companies: ICompany[] }>;
  // getAllJobPostService(): Promise<any>;
  // getAllCompanyService(): Promise<any>;
  getSeekerProfile(userId: string): Promise<any>;
  editSeekerDetailsService(
    seeker_id: string,
    seekerData: Partial<ISeeker>
  ): Promise<boolean>;
  newJobApplication(
    applicationData: IJobApplication,
    resumeFile: any
  ): Promise<IJobApplication>;
  updateProfileImg(seeker_id:string,image: any): Promise<boolean>;
}
