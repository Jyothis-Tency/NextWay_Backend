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
    } catch (error) {
      throw new CustomError(
        "Error finding company by email",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  register = async (userData: ICompany): Promise<ICompany> => {
    try {
      return await this.company.create(userData);
    } catch (error) {
      throw new CustomError(
        "Error registering company",
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
    } catch (error) {
      throw new CustomError(
        "Error updating password",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  getCompanyById = async (company_id: string): Promise<ICompany | null> => {
    try {
      return await this.company.findOne({ company_id: company_id });
    } catch (error) {
      throw new CustomError(
        "Error fetching company by ID",
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
    } catch (error) {
      throw new CustomError(
        "Error updating company",
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
    } catch (error) {
      throw new CustomError(
        "Error creating or updating job post",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  getAllJobs = async (): Promise<IJobPost[]> => {
    try {
      return await this.jobPosts.find().sort({ createdAt: -1 });
    } catch (error) {
      throw new CustomError(
        "Error fetching all jobs",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  getJobPostById = async (_id: string): Promise<IJobPost | null> => {
    try {
      return await this.jobPosts.findOne({ _id: _id });
    } catch (error) {
      throw new CustomError(
        "Error fetching job post by ID",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  deleteJobPost = async (_id: string): Promise<boolean> => {
    try {
      const result = await this.jobPosts.deleteOne({ _id: _id });
      return result.deletedCount === 1;
    } catch (error) {
      throw new CustomError(
        "Error deleting job post",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  jobApplicationsByCompanyId = async (
    company_id: string
  ): Promise<IJobApplication[]> => {
    try {
      return await this.jobApplication.find({ company_id: company_id });
    } catch (error) {
      throw new CustomError(
        "Error fetching job applications",
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
    } catch (error) {
      throw new CustomError(
        "Error updating profile image",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  jobApplicationsByJobId = async (
    jobId: string
  ): Promise<IJobApplication[]> => {
    try {
      return await this.jobApplication.find({ job_id: jobId });
    } catch (error) {
      throw new CustomError(
        `Error fetching job applications`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  updateApplicationStatus = async (
    applicationId: string,
    status: string,
    statusMessage: string
  ): Promise<boolean> => {
    try {
      const result = await this.jobApplication.updateOne(
        { _id: applicationId },
        { $set: { status, statusMessage } }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      throw new CustomError(
        `Error updating application status`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  getJobApplicationById = async (
    applicationId: string
  ): Promise<IJobApplication | null> => {
    try {
      return await this.jobApplication.findOne({ _id: applicationId });
    } catch (error) {
      throw new CustomError(
        "Error fetching job application by ID",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  searchByCompanyName = async (name: string): Promise<ICompany[]> => {
    try {
      return await this.company.find({ name: { $regex: name, $options: "i" } });
    } catch (error) {
      throw new CustomError(
        "Error searching for companies",
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
    } catch (error) {
      throw new CustomError(
        "Error setting interview details",
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
    } catch (error) {
      throw new CustomError(
        "Error fetching company by ID",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };
}

export default CompanyRepository;
