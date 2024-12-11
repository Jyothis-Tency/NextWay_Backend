import { Model } from "mongoose";
import { ISeekerRepository } from "../Interfaces/seeker_repository_interface";
import {
  ISeeker,
  IJobPost,
  ICompany,
  IJobApplication,
} from "../Interfaces/common_interface";
import { application } from "express";

class SeekerRepository implements ISeekerRepository {
  private seeker = Model<ISeeker>;
  private company = Model<ICompany>;
  private jobApplication = Model<IJobApplication>;

  constructor(
    seeker: Model<ISeeker>,
    company: Model<ICompany>,
    jobApplication: Model<IJobApplication>
  ) {
    this.seeker = seeker;
    this.company = company;
    this.jobApplication = jobApplication;
  }

  findByEmail = async (email: string): Promise<ISeeker | null> => {
    try {
      return await this.seeker.findOne({ email });
    } catch (error) {
      console.log(`Error in findByEmail at seekerRepository : ${error}`);

      throw error;
    }
  };

  // login = async (email: string): Promise<IUser> => {
  //   try {
  //     const userDetails = await this.userModel.aggregate([
  //       { $match: { email: email } },
  //     ]);
  //     return userDetails[0];
  //   } catch (error) {
  //     console.log(`Error in login at userRepository : ${error}`);
  //     throw error;
  //   }
  // };

  register = async (seekerData: ISeeker): Promise<ISeeker> => {
    try {
      return await this.seeker.create(seekerData);
    } catch (error) {
      console.log(`Error in register at seekerRepository : ${error}`);
      throw error;
    }
  };

  updatePassword = async (
    email: string,
    password: string
  ): Promise<ISeeker> => {
    try {
      console.log("updatePassword - ", email, password);

      const updatedSeeker = await this.seeker.findOneAndUpdate(
        { email },
        { $set: { password: password } }, // Update the password field
        { new: true } // Return the updated user document
      );

      return updatedSeeker;
    } catch (error) {
      console.log(`Error in updatePassword at seekerRepository : ${error}`);
      throw error;
    }
  };

  getSeekerById = async (seeker_id: string): Promise<any> => {
    try {
      return await this.seeker.findOne({ seeker_id: seeker_id }).lean();
    } catch (error) {
      throw error;
    }
  };

  putSeekerById = async (
    seeker_id: string,
    seekerData: Partial<ISeeker>
  ): Promise<boolean> => {
    try {
      const updatedSeeker = await this.seeker.updateOne(
        { seeker_id: seeker_id },
        { $set: seekerData }
      );
      if (updatedSeeker.modifiedCount === 0) {
        throw new Error("seeker not updated");
      }
      return true;
    } catch (error) {
      throw error;
    }
  };

  getAllCompaniesByIds = async (company_id: string[]): Promise<ICompany[]> => {
    try {
      const companies = await this.company.find({
        company_id: { $in: company_id },
      });
      console.log(`Companies fetched: ${companies.length}`);
      return companies;
    } catch (error) {
      console.log(`Error in getCompaniesByIds at companyRepository: ${error}`);
      throw error;
    }
  };
  postJobApplication = async (
    applicationData: IJobApplication
  ): Promise<IJobApplication> => {
    try {
      const result = await this.jobApplication.create(applicationData);
      return result;
    } catch (error) {
      throw error;
    }
  };
  
  postProfileImg = async (seeker_id: string, url: string): Promise<boolean> => {
    try {
      if (!seeker_id || !url) {
        throw new Error("no seeker_id and url");
      }
      const result = await this.seeker.updateOne(
        { seeker_id: seeker_id },
        { $set: { profilePicture: url } }
      );
      if (result.modifiedCount === 0) {
        throw new Error("Did'nt modify");
      }
      return true;
    } catch (error) {
      throw error;
    }
  };
  // getAllJobPosts = async (): Promise<any> => {
  //   try {
  //     return await this.jobPost.find({});
  //   } catch (error) {
  //     console.log(`Error in getAllJobPosts at seekerRepository : ${error}`);
  //     throw error;
  //   }
  // };

  // getAllCompanies = async (): Promise<any> => {
  //   try {
  //     return await this.company.find({});
  //   } catch (error) {
  //     console.log(`Error in getAllCompanies at seekerRepository : ${error}`);
  //     throw error;
  //   }
  // };
}

export default SeekerRepository;
