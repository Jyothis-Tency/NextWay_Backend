import { Model, Types } from "mongoose";
import { ICompanyRepository } from "../Interfaces/company_repository_interface";
import { ICompany, IJobApplication } from "../Interfaces/common_interface";
import { IJobPost } from "../Interfaces/common_interface";
import CustomError from "../Utils/customError";
import HttpStatusCode from "../Enums/httpStatusCodes";
import { application } from "express";

class CompanyRepository implements ICompanyRepository {
  private company = Model<ICompany>;
  private jobPosts = Model<IJobPost>;
  private jobApplication = Model<IJobApplication>;

  constructor(
    companyModel: Model<ICompany>,
    jobPostModel: Model<IJobPost>,
    jobApplication: Model<IJobApplication>
  ) {
    this.company = companyModel;
    this.jobPosts = jobPostModel;
    this.jobApplication = jobApplication;
  }

  findByEmail = async (email: string): Promise<ICompany | null> => {
    try {
      return await this.company.findOne({ email });
    } catch (error: unknown) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in company findByEmail: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  register = async (userData: ICompany): Promise<ICompany> => {
    try {
      return await this.company.create(userData);
    } catch (error: unknown) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in company register: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  updatePassword = async (
    email: string,
    password: string
  ): Promise<ICompany> => {
    try {
      const updatedUser = await this.company.findOneAndUpdate(
        { email },
        { $set: { password: password } },
        { new: true }
      );
      return updatedUser;
    } catch (error: unknown) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in company updatePassword: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  getCompanyById = async (company_id: string): Promise<ICompany | null> => {
    try {
      return await this.company.findOne({ company_id: company_id });
    } catch (error: unknown) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in company getCompanyById: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  putCompanyById = async (
    company_id: string,
    companyData: Partial<ICompany>
  ): Promise<boolean> => {
    try {
      const updatedCompany = await this.company.updateOne(
        { company_id: company_id },
        { $set: companyData }
      );
      return updatedCompany.modifiedCount > 0;
    } catch (error: unknown) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in company putCompanyById: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  createOrUpdateJobPost = async (jobPostData: IJobPost): Promise<IJobPost> => {
    try {
      const upsertedJobPost = await this.jobPosts.findOneAndUpdate(
        { _id: jobPostData._id || new Types.ObjectId() },
        { $set: jobPostData },
        { upsert: true, new: true }
      );
      return upsertedJobPost;
    } catch (error: unknown) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in company createOrUpdateJobPost: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  getAllJobs = async (): Promise<IJobPost[]> => {
    try {
      return await this.jobPosts.find().sort({ createdAt: -1 });
    } catch (error: unknown) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in company getAllJobs: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  getJobPostById = async (_id: string): Promise<IJobPost | null> => {
    try {
      return await this.jobPosts.findOne({ _id: _id });
    } catch (error: unknown) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in company getJobPostById: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  deleteJobPost = async (_id: string): Promise<boolean> => {
    try {
      const result = await this.jobPosts.deleteOne({ _id: _id });
      return result.deletedCount === 1;
    } catch (error: unknown) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in company deleteJobPost: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  jobApplicationsByCompanyId = async (
    company_id: string
  ): Promise<IJobApplication[]> => {
    try {
      return await this.jobApplication.find({ company_id: company_id });
    } catch (error: unknown) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in company jobApplicationsByCompanyId: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  postProfileImg = async (
    company_id: string,
    url: string
  ): Promise<boolean> => {
    try {
      const result = await this.company.updateOne(
        { company_id: company_id },
        { $set: { profileImage: url } }
      );
      return result.modifiedCount > 0;
    } catch (error: unknown) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in company postProfileImg: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  jobApplicationsByJobId = async (
    jobId: string
  ): Promise<IJobApplication[]> => {
    try {
      return await this.jobApplication.find({ job_id: jobId });
    } catch (error: unknown) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in company jobApplicationsJobId: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  updateApplicationStatus = async (
    applicationId: string,
    status: string,
    statusMessage: string,
    offerLetter: string
  ): Promise<boolean> => {
    try {
      const result = await this.jobApplication.updateOne(
        { _id: applicationId },
        { $set: { status, statusMessage, offerLetter } }
      );
      return result.modifiedCount > 0;
    } catch (error: unknown) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in company updateApplicationStatus: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  getJobApplicationById = async (
    applicationId: string
  ): Promise<IJobApplication | null> => {
    try {
      return await this.jobApplication.findOne({ _id: applicationId });
    } catch (error: unknown) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in company getJobApplicationById: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  searchByCompanyName = async (name: string): Promise<ICompany[]> => {
    try {
      return await this.company.find({ name: { $regex: name, $options: "i" } });
    } catch (error: unknown) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in company searchByCompanyName: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  setInterviewDetails = async (
    applicationId: string,
    interview: { interviewStatus: string; dateTime: Date; message: string }
  ): Promise<boolean> => {
    try {
      const result = await this.jobApplication.updateOne(
        { _id: applicationId },
        { $set: { interview } }
      );
      return result.modifiedCount > 0;
    } catch (error: unknown) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in company setInterviewDetails: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  changeVerificationStatus = async (
    company_id: string,
    newStatus: string
  ): Promise<boolean> => {
    try {
      const result = await this.company.updateOne(
        { company_id: company_id },
        { $set: { isVerified: newStatus } }
      );
      console.log("result in company repository", result);

      return result.modifiedCount > 0;
    } catch (error: unknown) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in company changeVerificationStatus: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };
}

export default CompanyRepository;
