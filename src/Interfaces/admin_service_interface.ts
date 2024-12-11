import { ICompany, ISeeker } from "./common_interface";

export interface IAdminServices {
  loginAdmin(
    email: string,
    password: string
  ): { email: string; adminAccessToken: string; adminRefreshToken: string };

  fetchAllSeekerDetails(): Promise<ISeeker[] | null>;
  fetchAllCompanyDetails(): Promise<ICompany[] | null>;
  seekerBlockOrUnBlock(seeker_id: string): Promise<ISeeker | null>;
  companyBlockOrUnBlock(company_id: string): Promise<ICompany | null>;
}
