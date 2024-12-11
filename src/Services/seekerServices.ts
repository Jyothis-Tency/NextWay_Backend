import bcrypt from "bcrypt";
import { v4 as uuid } from "uuid";
import {
  ICleanSeekerData,
  ISeeker,
  IJobPost,
  ICompany,
  IJobApplication,
} from "../Interfaces/common_interface";
import { ISeekerRepository } from "../Interfaces/seeker_repository_interface";
import { ICompanyRepository } from "../Interfaces/company_repository_interface";
import { ISeekerServices } from "../Interfaces/seeker_service_interface";
import redisClient from "../Utils/redisUtils";
import otpSender from "../Utils/otpUtils";
import { createToken, createRefreshToken } from "../Config/jwtConfig";
import FileService from "../Utils/fileUploadUtils";

class SeekerServices implements ISeekerServices {
  private seekerRepository: ISeekerRepository;
  private companyRepository: ICompanyRepository;
  private seekerData: ISeeker | null = null;
  private jobPosts: IJobPost | null = null;
  private OTP: string | null = null;
  private OTP_expiringTime: Date | null = null;
  private fileService: FileService;

  constructor(
    seekerRepository: ISeekerRepository,
    companyRepository: ICompanyRepository
  ) {
    this.seekerRepository = seekerRepository;
    this.companyRepository = companyRepository;
    this.fileService = new FileService();
  }

  loginSeeker = async (
    email: string,
    password: string
  ): Promise<{
    seekerData: ICleanSeekerData;
    accessToken: string;
    refreshToken: string;
  }> => {
    try {
      let seeker = await this.seekerRepository.findByEmail(email);
      if (!seeker) {
        throw new Error("email not found");
      }
      if (seeker.isBlocked) {
        throw new Error("seeker is blocked by admin");
      }
      console.log(`loginSeeker at seekerServices - ${seeker}`);

      const comparedPassword = await bcrypt.compare(
        password,
        seeker.password as string
      );
      if (!comparedPassword) {
        throw new Error("wrong password");
      }
      // if (seeker.isBlocked) {
      //   throw new Error("user is blocked");
      // }

      const accessToken = createToken(seeker.seeker_id as string, "seeker");
      const refreshToken = createRefreshToken(
        seeker.seeker_id as string,
        "seeker"
      );
      const seekerData = {
        seeker_id: seeker?.seeker_id,
        firstName: seeker?.firstName,
        lastName: seeker?.lastName,
        email: seeker?.email,
        phone: seeker?.phone,
        isBlocked: seeker?.isBlocked,
      };

      return { seekerData, accessToken, refreshToken };
    } catch (error) {
      console.log(`Error in login at userServices : ${error}`);
      throw error;
    }
  };

  registerSeeker = async (seekerData: ISeeker): Promise<boolean> => {
    try {
      console.log("registerSeeker triggered");

      const alreadyExists: ISeeker | null =
        await this.seekerRepository.findByEmail(seekerData.email);
      if (alreadyExists) {
        throw new Error("email already exist");
      }
      this.seekerData = seekerData;
      const otpSended = await otpSender(seekerData.email);
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
        this.seekerData!.password as string,
        10
      );
      this.seekerData!.password = hashedPassword;
      this.seekerData!.seeker_id = uuid();
      const response: ISeeker = await this.seekerRepository.register(
        this.seekerData!
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

  forgotPasswordEmail = async (email: string): Promise<boolean> => {
    try {
      let seekerData = await this.seekerRepository.findByEmail(email);
      if (!seekerData) {
        throw new Error("email not found");
      }

      const otpSended = await otpSender(seekerData.email);
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
      const updatedUserData = await this.seekerRepository.updatePassword(
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

  getAllJobPosts = async (): Promise<{
    jobPosts: IJobPost[];
    companies: ICompany[];
  }> => {
    try {
      console.log("getAllJobPosts");

      const jobPosts = await this.companyRepository.getAllJobs();

      if (!jobPosts || jobPosts.length === 0) {
        throw new Error("Job posts not found");
      }

      const companyIds = Array.from(
        new Set(jobPosts.map((job) => job.company_id))
      );

      const companies = await this.seekerRepository.getAllCompaniesByIds(
        companyIds
      );
      return { jobPosts, companies };
    } catch (error) {
      console.log(`Error in getAllJobPostService at userServices : ${error}`);
      throw error;
    }
  };
  // getAllCompanyService = async (): Promise<any> => {
  //   try {
  //     const result = await this.userRepository.getAllCompanies();
  //     return result;
  //   } catch (error) {
  //     console.log(`Error in getAllCompanyService at userServices : ${error}`);
  //     throw error;
  //   }
  // };

  getSeekerProfile = async (seeker_id: string): Promise<any> => {
    try {
      const seekerProfile = await this.seekerRepository.getSeekerById(
        seeker_id
      );
      if (!seekerProfile) {
        throw new Error("Seeker not found");
      }
      console.log("seekerProfile-----", seekerProfile);
      let imgBuffer = null;
      if (seekerProfile.profilePicture) {
        imgBuffer = await this.fileService.getFile(
          seekerProfile.profilePicture
        ); // Fetch binary image
      }
      return { seekerProfile, imgBuffer };
    } catch (error) {
      throw error;
    }
  };

  editSeekerDetailsService = async (
    seeker_id: string,
    seekerData: Partial<ISeeker>
  ): Promise<boolean> => {
    try {
      const result = await this.seekerRepository.putSeekerById(
        seeker_id,
        seekerData
      );
      if (!result) {
        throw new Error("seeker not updated");
      }
      return true;
    } catch (error: any) {
      console.log("log");

      throw new Error(`Error in editing seeker details: ${error.message}`);
    }
  };

  newJobApplication = async (
    applicationData: IJobApplication,
    resumeFile: any
  ): Promise<IJobApplication> => {
    try {
      const resumeUrl = await this.fileService.uploadFile(resumeFile);
      if (!resumeUrl) {
        throw new Error("resume url not present");
      }
      applicationData.resume = resumeUrl;
      const result = await this.seekerRepository.postJobApplication(
        applicationData
      );
      if (!result) {
        throw new Error("Failed to save job application.");
      }
      return result;
    } catch (error: any) {
      throw new Error(`Error in new job application: ${error.message}`);
    }
  };
  updateProfileImg = async (seeker_id:string,image: any): Promise<boolean> => {
    try {
      const resumeUrl = await this.fileService.uploadFile(image);
      if (!resumeUrl) {
        throw new Error("image not updated");
      }
      const result = await this.seekerRepository.postProfileImg(seeker_id,resumeUrl);
      if (!result) {
        throw new Error("Failed to save job application.");
      }
      return result;
    } catch (error: any) {
      throw new Error(`Error in new job application: ${error.message}`);
    }
  };
}

export default SeekerServices;
