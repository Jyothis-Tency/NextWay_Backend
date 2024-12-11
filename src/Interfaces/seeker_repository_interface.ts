import { IJobApplication, ISeeker } from "./common_interface";
import { IJobPost } from "./common_interface";
import { ICompany } from "./common_interface";

export interface ISeekerRepository {
  findByEmail(email: string): Promise<ISeeker | null>;
  // authenticate(email: string, password: string): Promise<ISeeker | null>;
  register(userData: ISeeker): Promise<ISeeker>;
  updatePassword(userId: string, newPassword: string): Promise<ISeeker>;
  getSeekerById(userId: string): Promise<ISeeker | null>;
  getAllCompaniesByIds(company_id: string[]): Promise<ICompany[]>;
  putSeekerById(
    seeker_id: string,
    seekerData: Partial<ISeeker>
  ): Promise<boolean>;
  postJobApplication(
    applicationData: IJobApplication
  ): Promise<IJobApplication>;
  postProfileImg(seeker_id:string,url: string): Promise<boolean>;
  // getAllJobPosts(): Promise<IJobPost[]>;
  // getAllCompanies(): Promise<ICompany[]>;
}
