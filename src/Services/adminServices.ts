import { createRefreshToken, createToken } from "../Config/jwtConfig";
import { v4 as uuidv4 } from "uuid";
import { IAdminServices } from "../Interfaces/admin_service_interface";
import { IAdminRepository } from "../Interfaces/admin_repository_interface";
import { ICompany, ISeeker } from "../Interfaces/common_interface";

const adminEmail = process.env.ADMIN_EMAIL!;
const adminPassword = process.env.ADMIN_PASSWORD!;

class AdminServices implements IAdminServices {
  private adminRepository: IAdminRepository;

  constructor(adminRepository: IAdminRepository) {
    this.adminRepository = adminRepository;
  }

  loginAdmin = (
    email: string,
    password: string
  ): { email: string; adminAccessToken: string; adminRefreshToken: string } => {
    try {
      console.log(adminEmail, adminPassword);
      console.log(email, password);

      if (email !== adminEmail) {
        throw new Error("Invalid email");
      } else if (password !== adminPassword) {
        throw new Error("Invalid password");
      }
      const adminAccessToken: string = createToken(email as string, "Admin");
      const adminRefreshToken: string = createRefreshToken(
        email as string,
        "Admin"
      );
      return { email, adminAccessToken, adminRefreshToken };
    } catch (error: any) {
      console.error("Error during admin login services:", error.message);
      throw error;
    }
  };

  fetchAllSeekerDetails = async (): Promise<ISeeker[] | null> => {
    try {
      const seekersData = await this.adminRepository.getAllSeekers();
      if (!seekersData) {
        throw new Error("seekers data not found");
      }
      return seekersData;
    } catch (error) {
      console.log(`Error in forgotPassword at userServices : ${error}`);
      throw error;
    }
  };
  fetchAllCompanyDetails = async (): Promise<ICompany[] | null> => {
    try {
      const companiesData = await this.adminRepository.getAllCompanies();
      if (!companiesData) {
        throw new Error("companies data not found");
      }
      return companiesData;
    } catch (error) {
      console.log(`Error in forgotPassword at userServices : ${error}`);
      throw error;
    }
  };

  seekerBlockOrUnBlock = async (seeker_id:string): Promise<ISeeker | null> => {
    try {
     
      
      const result = await this.adminRepository.toggleSeekerBlock(seeker_id);
      if (!result) {
        throw new Error("seeker not found");
      }
      return result;
    } catch (error) {
      console.log(`Error in forgotPassword at userServices : ${error}`);
      throw error;
    }
  };
  companyBlockOrUnBlock = async (company_id:string): Promise<ICompany | null> => {
    try {
       console.log(company_id);
      const result = await this.adminRepository.toggleCompanyBlock(company_id);
      if (!result) {
        throw new Error("company not found");
      }
      return result;
    } catch (error) {
      console.log(`Error in forgotPassword at userServices : ${error}`);
      throw error;
    }
  };
}

export default AdminServices;
