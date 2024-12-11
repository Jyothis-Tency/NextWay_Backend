import { ICompany, ISeeker } from "./common_interface";

export interface IAdminRepository {
  getAllSeekers(): Promise<ISeeker[] | null>;
  getAllCompanies(): Promise<ICompany[] | null>;
  toggleCompanyBlock(company_id: string): Promise<ICompany | null>;
  toggleSeekerBlock(seeker_id: string): Promise<ISeeker | null>;
}
