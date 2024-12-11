import {
  IJobPost,
  ICompany,
  ICleanCompanyData,
  IJobApplication,
} from "../Interfaces/common_interface";
import bcrypt from "bcrypt";
import { v4 as uuid } from "uuid";
import { ICompanyRepository } from "../Interfaces/company_repository_interface";
import { ICompanyServices } from "../Interfaces/company_service_interface";
import redisClient from "../Utils/redisUtils";
import otpSender from "../Utils/otpUtils";
import { createToken, createRefreshToken } from "../Config/jwtConfig";
import { throwDeprecation } from "process";

class CompanyServices implements ICompanyServices {
  private companyRepository: ICompanyRepository;
  private companyData: ICompany | null = null;

  constructor(companyRepository: ICompanyRepository) {
    this.companyRepository = companyRepository;
  }

  registerCompany = async (companyData: ICompany): Promise<boolean> => {
    try {
      console.log("registerSeeker triggered");

      const alreadyExists: ICompany | null =
        await this.companyRepository.findByEmail(companyData.email);
      if (alreadyExists) {
        throw new Error("email already exist");
      }
      this.companyData = companyData;
      const otpSended = await otpSender(companyData.email);
      if (!otpSended) {
        throw new Error("otp not send");
      }
      return true;
    } catch (error) {
      console.log(`Error in registerSeeker at seekerServices : ${error}`);
      throw error;
    }
  };

  otpVerification = async (
    email: string,
    receivedOTP: string
  ): Promise<boolean> => {
    try {
      console.log(`email - ${email}, password - ${receivedOTP}`);

      const getOTP = await redisClient.get(email);
      console.log(`redis otp: ${getOTP}`);
      if (!getOTP) {
        throw new Error("OTP expired or doesn't exist");
      } else if (getOTP !== receivedOTP) {
        throw new Error("incorrect OTP");
      }

      const hashedPassword = await bcrypt.hash(
        this.companyData!.password as string,
        10
      );
      this.companyData!.password = hashedPassword;
      this.companyData!.company_id = uuid();
      const response: ICompany = await this.companyRepository.register(
        this.companyData!
      );
      await redisClient.del(email);
      return true;
    } catch (error) {
      console.log(`Error in otpVerification at userServices : ${error}`);
      throw error;
    }
  };

  resentOtp = async (email: string): Promise<boolean> => {
    try {
      await redisClient.del(email);
      const otpSended = await otpSender(email);
      if (!otpSended) {
        throw new Error("otp not resend");
      }
      return true;
    } catch (error) {
      throw error;
    }
  };

  loginCompany = async (
    email: string,
    password: string
  ): Promise<{
    companyData: ICleanCompanyData;
    accessToken: string;
    refreshToken: string;
  }> => {
    try {
      let company = await this.companyRepository.findByEmail(email);
      if (!company) {
        throw new Error("email not found");
      }
      console.log(`loginSeeker at seekerServices - ${company}`);

      const comparedPassword = await bcrypt.compare(
        password,
        company.password as string
      );
      if (!comparedPassword) {
        throw new Error("wrong password");
      }
      if (company.isBlocked) {
        throw new Error("company is blocked by admin");
      }

      const accessToken = createToken(company.company_id as string, "company");
      const refreshToken = createRefreshToken(
        company.company_id as string,
        "company"
      );
      const companyData = {
        company_id: company?.company_id,
        name: company?.name,
        email: company?.email,
        phone: company?.phone,
        isBlocked: company?.isBlocked,
      };

      return { companyData, accessToken, refreshToken };
    } catch (error) {
      console.log(`Error in login at userServices : ${error}`);
      throw error;
    }
  };

  forgotPasswordEmail = async (email: string): Promise<boolean> => {
    try {
      let companyData = await this.companyRepository.findByEmail(email);
      if (!companyData) {
        throw new Error("email not found");
      }
      const otpSended = await otpSender(companyData.email);
      if (!otpSended) {
        throw new Error("otp not send");
      }
      return true;
    } catch (error) {
      throw error;
    }
  };

  forgotPasswordOTP = async (
    email: string,
    receivedOTP: string
  ): Promise<Boolean> => {
    try {
      const getOTP = await redisClient.get(email);
      console.log(`redis otp: ${getOTP}`);
      if (!getOTP) {
        throw new Error("OTP expired or doesn't exist");
      } else if (getOTP !== receivedOTP) {
        throw new Error("incorrect OTP");
      }
      await redisClient.del(email);
      return true;
    } catch (error) {
      throw error;
    }
  };

  forgotPasswordReset = async (
    email: string,
    password: string
  ): Promise<Boolean> => {
    try {
      const hashedPassword = await bcrypt.hash(password as string, 10);
      const updatedUserData = await this.companyRepository.updatePassword(
        email,
        hashedPassword
      );
      if (!updatedUserData) {
        throw new Error("User not found");
      }
      if (updatedUserData.password !== password) {
        console.log("Password not changed");
      }
      return true;
    } catch (error) {
      console.log(`Error in forgotPassword at userServices : ${error}`);
      throw error;
    }
  };

  getCompanyDetails = async (company_id: string): Promise<ICompany | null> => {
    try {
      const companyData = await this.companyRepository.getCompanyById(
        company_id
      );
      if (!companyData) {
        throw new Error("Company not found");
      }
      return companyData;
    } catch (error) {
      console.log(`Error in forgotPassword at userServices : ${error}`);
      throw error;
    }
  };

  editCompanyDetails = async (
    company_id: string,
    companyData: Partial<ICompany>
  ): Promise<boolean> => {
    try {
      const result = await this.companyRepository.putCompanyById(
        company_id,
        companyData
      );
      if (!result) {
        throw new Error("company not updated");
      }
      return true;
    } catch (error) {
      throw error;
    }
  };

  // getJobsByCompany_Id=async(company_id: string): Promise<[ICompany]>=> {
  //     try {
  //       const result = await this.companyRepository.putCompanyById(
  //         company_id,

  //       );
  //       if (!result) {
  //         throw new Error("company not updated");
  //       }
  //       return true;
  //     } catch (error) {
  //       throw error;
  //     }
  // }

  createOrUpdateJobPost = async (jobPostData: IJobPost): Promise<boolean> => {
    try {
      const result = await this.companyRepository.createOrUpdateJobPost(
        jobPostData
      );
      if (!result) {
        throw new Error(
          "error occurred while creating or updating the job post"
        );
      }
      return true;
    } catch (error) {
      throw error;
    }
  };

  jobPostsByCompanyId = async (
    company_id: string
  ): Promise<IJobPost[] | null> => {
    try {
      const allJobPosts = await this.companyRepository.getAllJobs(); // Fetch all job posts
      const jobPosts = allJobPosts.filter(
        (job) => job.company_id === company_id
      ); // Filter by company_id

      console.log(`Filtered jobPosts - ${jobPosts}`);

      if (!jobPosts || jobPosts.length === 0) {
        throw new Error("Jobs not found for the specified company");
      }

      return jobPosts;
    } catch (error) {
      console.log(`Error in jobPostsByCompany at companyService - ${error}`);
      throw error;
    }
  };
  getJobPostByJobId = async (_id: string): Promise<IJobPost | null> => {
    try {
      const jobPost = await this.companyRepository.getJobPostById(_id);
      console.log(`jobPosts - ${jobPost}`);

      if (!jobPost) {
        throw new Error("job is not fount");
      }
      return jobPost;
    } catch (error) {
      console.log(`Error in getJobsByCompany_Id at companyService - ${error}`);
      throw error;
    }
  };
  deleteJobPostById = async (_id: string): Promise<boolean> => {
    try {
      const result = await this.companyRepository.deleteJobPost(_id);
      console.log(`results - ${result}`);

      if (!result) {
        throw new Error("job post not deleted");
      }
      return true;
    } catch (error) {
      console.log(`Error in getJobsByCompany_Id at companyService - ${error}`);
      throw error;
    }
  };

  getJobApplicationsByCompanyId = async (
    company_id: string
  ): Promise<IJobApplication[]> => {
    try {
      const jobApplications =
        await this.companyRepository.jobApplicationsByCompanyId(company_id);
      if (!jobApplications) {
        throw new Error("there is no job application in this company");
      }
      return jobApplications;
    } catch (error) {
      throw error;
    }
  };
  //   allJobPost = async (userId: string): Promise<IJobPost[]> => {
  //     try {
  //       console.log(`Fetching all job posts in recruiter service`);
  //       const jobPosts: IJobPost[] = await this.recruiterRepository.getAllJobPost(
  //         userId
  //       );
  //       return jobPosts;
  //     } catch (error) {
  //       console.error(`Error in allJobPost at recruiter service: ${error}`);
  //       throw error;
  //     }
  //   };

  //   newJobPost = async (jobData: IJobPost, userId: string): Promise<boolean> => {
  //     try {
  //       console.log(`newJobPost in recruiter service`);
  //       console.log(jobData);

  //       const jobPostExisted: IJobPost | null =
  //         await this.recruiterRepository.findByTitle(jobData.title);
  //       if (jobPostExisted) {
  //         throw new Error("this job already existed");
  //       }
  //       await this.recruiterRepository.createJob(jobData, userId);
  //       return true;
  //     } catch (error) {
  //       throw error;
  //     }
  //   };

  //   newCompany = async (
  //     companyData: ICompany,
  //     userId: string
  //   ): Promise<boolean> => {
  //     try {
  //       console.log(`newCompany in recruiter service`);
  //       console.log(companyData);

  //       // Check if a company with the same name already exists
  //       const existingCompany: ICompany | null =
  //         await this.recruiterRepository.findCompany(companyData.name);
  //       if (existingCompany) {
  //         throw new Error("This company already exists");
  //       }

  //       // Save the new company to the database
  //       await this.recruiterRepository.createCompany(companyData, userId);
  //       return true;
  //     } catch (error) {
  //       console.log(`Error in newCompany at recruiterService: ${error}`);
  //       throw error;
  //     }
  //   };

  //   getCompanyDetails = async (userId: string): Promise<ICompany | null> => {
  //     try {
  //       const company = await this.recruiterRepository.companyDetails(userId);

  //       if (!company) {
  //         throw new Error("there is no company existed");
  //       }

  //       return company;
  //     } catch (error) {
  //       console.error("Error in getCompanyByUserId service:", error);
  //       throw error;
  //     }
  //   };
}

export default CompanyServices;
