import { ICompany, IJobPost,IJobApplication } from "./common_interface";

export interface ICompanyRepository {
  findByEmail(email: string): Promise<ICompany | null>;
  register(userData: ICompany): Promise<ICompany>;
  updatePassword(userId: string, newPassword: string): Promise<ICompany>;
  getCompanyById(company_id: string): Promise<ICompany | null>;
  putCompanyById(
    company_id: string,
    companyData: Partial<ICompany>
  ): Promise<boolean>;
  createOrUpdateJobPost(jobPostData: IJobPost): Promise<boolean>;
  // getJobsByCompany_Id(company_id: string): Promise<IJobPost[]>;
  getAllJobs(): Promise<IJobPost[]>;
  getJobPostById(_id: string): Promise<IJobPost | null>;
  deleteJobPost(_id: string): Promise<boolean>;
  jobApplicationsByCompanyId(company_id: string): Promise<IJobApplication[]>;

  // getAllJobPost(userId: string): Promise<IJobPost[]>;
  // findByTitle(title: string): Promise<IJobPost | null>;
  // findCompany(name: string): Promise<ICompany | null>;
  // createJob(jobData: IJobPost, userId: string): Promise<boolean>;
  // createCompany(companyData: ICompany, userId: string): Promise<boolean>;
  // companyDetails(user_id: string): Promise<ICompany | null>;
}
