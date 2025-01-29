import { stat } from "fs";
import { ICompany, IJobPost, IJobApplication } from "./common_interface";

export interface ICompanyRepository {
  findByEmail(email: string): Promise<ICompany | null>;
  register(userData: ICompany): Promise<ICompany>;
  updatePassword(userId: string, newPassword: string): Promise<ICompany>;
  getCompanyById(company_id: string): Promise<ICompany | null>;
  putCompanyById(
    company_id: string,
    companyData: Partial<ICompany>
  ): Promise<boolean>;
  createOrUpdateJobPost(jobPostData: IJobPost): Promise<IJobPost>;
  // getJobsByCompany_Id(company_id: string): Promise<IJobPost[]>;
  getAllJobs(): Promise<IJobPost[]>;
  getJobPostById(_id: string): Promise<IJobPost | null>;
  deleteJobPost(_id: string): Promise<boolean>;
  jobApplicationsByCompanyId(company_id: string): Promise<IJobApplication[]>;
  postProfileImg(user_id: string, url: string): Promise<boolean>;
  jobApplicationsByJobId(jobId: string): Promise<IJobApplication[]>;
  updateApplicationStatus(
    applicationId: string,
    status: string,
    statusMessage: string
  ): Promise<boolean>;
  getJobApplicationById(applicationId: string): Promise<IJobApplication | null>;
  searchByCompanyName(name: string): Promise<ICompany[]>;
  setInterviewDetails(
    applicationId: string,
    interview: { interviewStatus: string; dateTime: Date }
  ): Promise<boolean>;
  // getAllJobPost(userId: string): Promise<IJobPost[]>;
  // findByTitle(title: string): Promise<IJobPost | null>;
  // findCompany(name: string): Promise<ICompany | null>;
  // createJob(jobData: IJobPost, userId: string): Promise<boolean>;
  // createCompany(companyData: ICompany, userId: string): Promise<boolean>;
  // companyDetails(user_id: string): Promise<ICompany | null>;
}
