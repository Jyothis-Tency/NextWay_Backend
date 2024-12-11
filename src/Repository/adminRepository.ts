import { Model, Types } from "mongoose";
import { ICompanyRepository } from "../Interfaces/company_repository_interface";
import { ICompany, ISeeker } from "../Interfaces/common_interface";
import { IJobPost } from "../Interfaces/common_interface";
import { IAdminRepository } from "../Interfaces/admin_repository_interface";

class AdminRepository implements IAdminRepository {
  private company = Model<ICompany>;
  private seeker = Model<ISeeker>;

  constructor(companyModel: Model<ICompany>, seekerModel: Model<ISeeker>) {
    this.company = companyModel;
    this.seeker = seekerModel;
  }

  getAllSeekers = async (): Promise<ISeeker[] | null> => {
    try {
      return await this.seeker.find();
    } catch (error) {
      console.log(`Error in findByEmail at seekerRepository : ${error}`);

      throw error;
    }
  };

  getAllCompanies = async (): Promise<ICompany[] | null> => {
    try {
      return await this.company.find();
    } catch (error) {
      console.log(`Error in findByEmail at seekerRepository : ${error}`);

      throw error;
    }
  };

  toggleCompanyBlock = async (company_id: string): Promise<ICompany | null> => {
    try {
      // Find the company by ID
      console.log("company_id",company_id);
      
      const company = await this.company.findOne({ company_id: company_id });
      console.log("company -",company);
      
      if (!company) {
        throw new Error(`Company with ID ${company_id} not found.`);
      }

      // Toggle the isBlocked field
      company.isBlocked = !company.isBlocked;

      // Save the updated company document
      await company.save();

      return company;
    } catch (error) {
      console.log(`Error in toggleCompanyBlock at companyRepository: ${error}`);
      throw error;
    }
  };

  toggleSeekerBlock = async (seeker_id: string): Promise<ISeeker | null> => {
    try {
      // Find the company by ID
      const seeker = await this.seeker.findOne({ seeker_id: seeker_id });

      if (!seeker) {
        throw new Error(`Company with ID ${seeker_id} not found.`);
      }

      // Toggle the isBlocked field
      seeker.isBlocked = !seeker.isBlocked;

      // Save the updated seeker document
      await seeker.save();

      return seeker;
    } catch (error) {
      console.log(`Error in toggleCompanyBlock at companyRepository: ${error}`);
      throw error;
    }
  };
}

export default AdminRepository;
