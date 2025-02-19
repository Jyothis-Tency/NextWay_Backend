import {
  IJobPost,
  ICompany,
  ICleanCompanyData,
  IJobApplication,
  IUser,
} from "../Interfaces/common_interface";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import { ICompanyRepository } from "../Interfaces/company_repository_interface";
import { ICompanyServices } from "../Interfaces/company_service_interface";
import { IAdminRepository } from "../Interfaces/admin_repository_interface";
import { IUserRepository } from "../Interfaces/user_repository_interface";
import redisClient from "../Utils/redisUtils";
import otpSender from "../Utils/otpUtils";
import { createAccessToken, createRefreshToken } from "../Config/jwtConfig";
import { ObjectId } from "mongodb";
import crypto from "crypto";
import CustomError from "../Utils/customError";
import HttpStatusCode from "../Enums/httpStatusCodes";
import FileService from "../Utils/fileUploadUtils";
import {
  sendNewJobNotification,
  sendApplicationStatusUpdate,
} from "../Utils/emailNotificationUtils";
import {
  emitNewJobNotification,
  emitApplicationStatusUpdate,
  // emitApplicationStatusUpdate,
} from "../Config/socketConfig";

class CompanyServices implements ICompanyServices {
  private companyRepository: ICompanyRepository;
  private adminRepository: IAdminRepository;
  private userRepository: IUserRepository;
  private companyData: ICompany | null = null;
  private fileService: FileService;
  private tempCertificate: Express.Multer.File | null = null;

  constructor(
    companyRepository: ICompanyRepository,
    adminRepository: IAdminRepository,
    userRepository: IUserRepository
  ) {
    this.companyRepository = companyRepository;
    this.adminRepository = adminRepository;
    this.userRepository = userRepository;
    this.fileService = new FileService();
  }

  registerCompany = async (
    companyData: ICompany,
    certificate?: Express.Multer.File
  ): Promise<boolean> => {
    try {
      const alreadyExists = await this.companyRepository.findByEmail(
        companyData.email
      );
      if (alreadyExists) {
        throw new CustomError("Email already exists", HttpStatusCode.CONFLICT);
      }
      if (!certificate) {
        throw new CustomError("Certificate not found", HttpStatusCode.NOT_FOUND);
      }
      const certificateUrl = await this.fileService.uploadFile(certificate);
      console.log(certificateUrl);

      await redisClient.setEx(
        `${companyData.email}:data`,
        300,
        JSON.stringify(companyData)
      );
      console.log(certificate);

      this.tempCertificate = certificate;
      // this.companyData = companyData;
      console.log(companyData);

      const otpSended = await otpSender(companyData.email);
      if (!otpSended) {
        throw new CustomError("Failed to send OTP", HttpStatusCode.BAD_REQUEST);
      }
      return true;
    } catch (error: unknown) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in company registration: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  otpVerification = async (
    email: string,
    receivedOTP: string
  ): Promise<boolean> => {
    try {
      const getOTP = await redisClient.get(`${email}:otp`);
      const getData = await redisClient.get(`${email}:data`);

      if (!getOTP) {
        throw new CustomError(
          "OTP expired or doesn't exist",
          HttpStatusCode.BAD_REQUEST
        );
      }
      if (getOTP !== receivedOTP) {
        throw new CustomError("Incorrect OTP", HttpStatusCode.BAD_REQUEST);
      }
      if (!getData) {
        throw new CustomError(
          "Company data not found",
          HttpStatusCode.NOT_FOUND
        );
      }

      const companyData: ICompany | null = getData ? JSON.parse(getData) : null;

      if (!getOTP) {
        throw new CustomError(
          "OTP expired or doesn't exist",
          HttpStatusCode.BAD_REQUEST
        );
      }
      if (getOTP !== receivedOTP) {
        throw new CustomError("Incorrect OTP", HttpStatusCode.BAD_REQUEST);
      }
      if (!companyData) {
        throw new CustomError(
          "Company data not found",
          HttpStatusCode.NOT_FOUND
        );
      }

      const hashedPassword = await bcrypt.hash(
        companyData.password as string,
        10
      );
      companyData.password = hashedPassword;

      const uuidCode = uuidv4();
      const hash = crypto.createHash("sha256").update(uuidCode).digest("hex");
      const objectIdHex = hash.substring(0, 24);
      const obId = new ObjectId(objectIdHex);
      companyData.company_id = obId;

      const certificateFile: Express.Multer.File | null = this.tempCertificate;
      console.log("certificateFileeee", certificateFile);

      if (!certificateFile) {
        throw new CustomError(
          "Certificate file is missing",
          HttpStatusCode.BAD_REQUEST
        );
      }
      const certificateUrl = await this.fileService.uploadFile(certificateFile);
      if (!certificateUrl) {
        throw new CustomError(
          "Failed to upload image",
          HttpStatusCode.BAD_REQUEST
        );
      }
      companyData.certificate = certificateUrl;

      const response = await this.companyRepository.register(companyData);
      if (!response) {
        throw new CustomError(
          "Failed to register company",
          HttpStatusCode.BAD_REQUEST
        );
      }

      await redisClient.del(`${email}:data`);
      await redisClient.del(`${email}:otp`);
      return true;
    } catch (error: unknown) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in company otpVerification: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  resentOtp = async (email: string): Promise<boolean> => {
    try {
      await redisClient.del(email);
      const otpSended = await otpSender(email);
      if (!otpSended) {
        throw new CustomError(
          "Failed to resend OTP",
          HttpStatusCode.BAD_REQUEST
        );
      }
      return true;
    } catch (error: unknown) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in company resendOtp: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
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
      const company = await this.companyRepository.findByEmail(email);
      if (!company) {
        throw new CustomError("Email not found", HttpStatusCode.NOT_FOUND);
      }
      if (company.isBlocked) {
        throw new CustomError(
          "Company is blocked by admin",
          HttpStatusCode.FORBIDDEN
        );
      }

      const comparedPassword = await bcrypt.compare(
        password,
        company.password as string
      );
      if (!comparedPassword) {
        throw new CustomError("Invalid password", HttpStatusCode.UNAUTHORIZED);
      }
      let imgBuffer;
      if (company.profileImage) {
        imgBuffer = await this.fileService.getFile(company.profileImage);
      }
      let imageBase64 = "";
      if (imgBuffer) {
        imageBase64 = `data:image/jpeg;base64,${imgBuffer.toString("base64")}`;
      }
      const accessToken = createAccessToken(company.company_id, company.role);
      const refreshToken = createRefreshToken(company.company_id, company.role);
      const companyData = {
        company_id: company?.company_id,
        name: company?.name,
        email: company?.email,
        phone: company?.phone,
        accessToken: accessToken,
        refreshToken: refreshToken,
        role: company.role,
        isBlocked: company?.isBlocked,
        profileImage: imageBase64,
        isVerified: company.isVerified,
      };

      return { companyData, accessToken, refreshToken };
    } catch (error: unknown) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in loginCompany: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  forgotPasswordEmail = async (email: string): Promise<boolean> => {
    try {
      let companyData = await this.companyRepository.findByEmail(email);
      if (!companyData) {
        throw new CustomError("Email not found", HttpStatusCode.NOT_FOUND);
      }
      const otpSended = await otpSender(companyData.email);
      if (!otpSended) {
        throw new CustomError("Failed to send OTP", HttpStatusCode.BAD_REQUEST);
      }
      return true;
    } catch (error: unknown) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in company forgotPasswordEmail: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  forgotPasswordOTP = async (
    email: string,
    receivedOTP: string
  ): Promise<boolean> => {
    try {
      const getOTP = await redisClient.get(email);
      if (!getOTP) {
        throw new CustomError(
          "OTP expired or doesn't exist",
          HttpStatusCode.BAD_REQUEST
        );
      } else if (getOTP !== receivedOTP) {
        throw new CustomError("Incorrect OTP", HttpStatusCode.BAD_REQUEST);
      }
      await redisClient.del(email);
      return true;
    } catch (error: unknown) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in company forgotPasswordOTP: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  forgotPasswordReset = async (
    email: string,
    password: string
  ): Promise<boolean> => {
    try {
      const hashedPassword = await bcrypt.hash(password as string, 10);
      const updatedUserData = await this.companyRepository.updatePassword(
        email,
        hashedPassword
      );
      if (!updatedUserData) {
        throw new CustomError("User not found", HttpStatusCode.NOT_FOUND);
      }
      return true;
    } catch (error: unknown) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in company forgotPasswordReset: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  getCompanyDetails = async (
    company_id: string
  ): Promise<{ companyProfile: ICompany; imgBuffer: Buffer | null }> => {
    try {
      const companyProfile = await this.companyRepository.getCompanyById(
        company_id
      );
      if (!companyProfile) {
        throw new CustomError("Company not found", HttpStatusCode.NOT_FOUND);
      }

      let imgBuffer = null;
      if (companyProfile.profileImage) {
        imgBuffer = await this.fileService.getFile(companyProfile.profileImage);
      }
      return { companyProfile, imgBuffer };
    } catch (error: unknown) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in getCompanyDetails: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
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
        throw new CustomError(
          "Failed to update company",
          HttpStatusCode.BAD_REQUEST
        );
      }
      return true;
    } catch (error: unknown) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in editCompanyDetails: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
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
      const company = await this.companyRepository.getCompanyById(
        jobPostData.company_id
      );
      if (company?.isVerified === "pending") {
        throw new CustomError(
          "You can't post job until admin verifies your account",
          HttpStatusCode.BAD_REQUEST
        );
      }
      const result = await this.companyRepository.createOrUpdateJobPost(
        jobPostData
      );

      if (!result) {
        throw new CustomError(
          "Failed to create or update job post",
          HttpStatusCode.BAD_REQUEST
        );
      }
      if (!jobPostData._id) {
        if (company) {
          sendNewJobNotification(
            company.name,
            jobPostData.title,
            jobPostData.location
          );

          emitNewJobNotification({
            job_id: result._id as string,
            title: jobPostData.title,
            company: company.name,
            location: jobPostData.location,
          });
        }
      }
      return true;
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

  jobPostsByCompanyId = async (company_id: string): Promise<IJobPost[]> => {
    try {
      const allJobPosts = await this.companyRepository.getAllJobs();
      const jobPosts = allJobPosts.filter(
        (job) => job.company_id === company_id
      );

      if (!jobPosts || jobPosts.length === 0) {
        throw new CustomError(
          "No job posts found for this company",
          HttpStatusCode.NOT_FOUND
        );
      }
      return jobPosts;
    } catch (error: unknown) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in company jobPostByCompanyId: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };
  getJobPostByJobId = async (_id: string): Promise<IJobPost | null> => {
    try {
      const jobPost = await this.companyRepository.getJobPostById(_id);
      if (!jobPost) {
        throw new CustomError("Job post not found", HttpStatusCode.NOT_FOUND);
      }
      return jobPost;
    } catch (error: unknown) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in company registration: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };
  deleteJobPostById = async (_id: string): Promise<boolean> => {
    try {
      const result = await this.companyRepository.deleteJobPost(_id);
      if (!result) {
        throw new CustomError(
          "Failed to delete job post",
          HttpStatusCode.BAD_REQUEST
        );
      }
      return true;
    } catch (error: unknown) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in company deleteJobPostById: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  getJobApplicationsByCompanyId = async (
    company_id: string
  ): Promise<IJobApplication[]> => {
    try {
      const jobApplications =
        await this.companyRepository.jobApplicationsByCompanyId(company_id);
      if (!jobApplications || jobApplications.length === 0) {
        throw new CustomError(
          "No job applications found for this company",
          HttpStatusCode.NOT_FOUND
        );
      }
      return jobApplications;
    } catch (error: unknown) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in company getJobApplicationsByCompanyId: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  getJobApplicationsByJobId = async (
    jobId: string
  ): Promise<IJobApplication[]> => {
    try {
      const jobApplications =
        await this.companyRepository.jobApplicationsByJobId(jobId);
      if (!jobApplications || jobApplications.length === 0) {
        throw new CustomError(
          "No job applications found for this job",
          HttpStatusCode.NOT_FOUND
        );
      }
      return jobApplications;
    } catch (error: unknown) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in company getJobApplicationsByJobId: ${
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
    offerLetter?: Express.Multer.File
  ): Promise<boolean> => {
    try {
      const jobApplication = await this.companyRepository.getJobApplicationById(
        applicationId
      );

      if (!jobApplication) {
        throw new CustomError(
          "Application not found",
          HttpStatusCode.NOT_FOUND
        );
      }

      const jobPost = await this.companyRepository.getJobPostById(
        jobApplication.job_id.toString()
      );
      if (!jobPost) {
        throw new CustomError("Job post not found", HttpStatusCode.NOT_FOUND);
      }

      const company = await this.companyRepository.getCompanyById(
        jobPost.company_id
      );
      if (!company) {
        throw new CustomError("Company not found", HttpStatusCode.NOT_FOUND);
      }
      const user = await this.userRepository.findByEmail(jobApplication.email);
      if (
        user?.isSubscribed &&
        user?.subscriptionFeatures.includes("google_notification")
      ) {
        sendApplicationStatusUpdate(
          jobApplication.email,
          company.name,
          jobPost.title,
          status
        );
      }

      emitApplicationStatusUpdate(
        {
          applicationId,
          jobId: jobApplication.job_id.toString(),
          companyName: company.name,
          jobTitle: jobPost.title,
          status,
        },
        jobApplication.user_id
      );
      if (!offerLetter) {
        throw new CustomError("offerLetter not found", HttpStatusCode.NOT_FOUND);
      }
      const offerLetterUrl = await this.fileService.uploadFile(offerLetter);
      let offerLetterStr = "";
      if (offerLetterUrl) {
        offerLetterStr = offerLetterUrl;
      }

      await this.companyRepository.updateApplicationStatus(
        applicationId,
        status,
        statusMessage,
        offerLetterStr
      );
      return true;
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

  updateProfileImg = async (
    company_id: string,
    image?: Express.Multer.File
  ): Promise<boolean> => {
    try {
      if (!image) {
        throw new CustomError(
          "image not found",
          HttpStatusCode.NOT_FOUND
        );
      }
      const imageUrl = await this.fileService.uploadFile(image);
      if (!imageUrl) {
        throw new CustomError(
          "Failed to upload image",
          HttpStatusCode.BAD_REQUEST
        );
      }

      const result = await this.companyRepository.postProfileImg(
        company_id,
        imageUrl
      );
      if (!result) {
        throw new CustomError(
          "Failed to update profile image",
          HttpStatusCode.BAD_REQUEST
        );
      }
      return result;
    } catch (error: unknown) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in company registration: ${
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
      const application = await this.companyRepository.getJobApplicationById(
        applicationId
      );

      if (!application) {
        throw new CustomError(
          "Application not found",
          HttpStatusCode.NOT_FOUND
        );
      }

      // Get resume from S3 if it exists
      let resumeBuffer;
      let resumeBase64 = "";

      if (application.resume) {
        resumeBuffer = await this.fileService.getFile(application.resume);

        // Convert to base64 and add appropriate data URI prefix for PDF
        if (resumeBuffer) {
          resumeBase64 = `data:application/pdf;base64,${resumeBuffer.toString(
            "base64"
          )}`;
        }
      }
      application.resume = resumeBase64;
      return application;
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

  searchUser = async (query: string): Promise<IUser[]> => {
    try {
      return await this.userRepository.searchByUserName(query);
    } catch (error: unknown) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in company searchUser: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  setInterviewDetails = async (
    applicationId: string,
    interviewDetails: {
      interviewStatus: string;
      dateTime: Date;
      message: string;
    }
  ): Promise<boolean> => {
    try {
      const result = await this.companyRepository.setInterviewDetails(
        applicationId,
        interviewDetails
      );
      if (!result) {
        throw new CustomError(
          "Failed to set interview details",
          HttpStatusCode.BAD_REQUEST
        );
      }
      return true;
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

  getAllUserProfileImages = async (): Promise<
    {
      user_id: string;
      profileImage: string;
    }[]
  > => {
    try {
      const allUsers = await this.adminRepository.getAllUsers();
      if (!allUsers) {
        return [];
      }

      // Use Promise.all to handle multiple async operations
      const userImagesWithId = await Promise.all(
        allUsers
          .filter((user) => user.profileImage) // Filter companies with profile images
          .map(async (user) => {
            const imageURL = await this.fileService.getFile(
              user.profileImage as string
            );
            return {
              user_id: user.user_id.toString(),
              profileImage: `data:image/jpeg;base64,${imageURL.toString(
                "base64"
              )}`,
            };
          })
      );

      return userImagesWithId;
    } catch (error: unknown) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in company getAllUserProfileImages: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  getUserProfile = async (
    user_id: string
  ): Promise<{ userProfile: IUser; imgBuffer: Buffer | null }> => {
    try {
      const userProfile = await this.userRepository.getUserById(user_id);
      if (!userProfile) {
        throw new CustomError("User not found", HttpStatusCode.NOT_FOUND);
      }

      let imgBuffer = null;
      if (userProfile.profileImage) {
        imgBuffer = await this.fileService.getFile(userProfile.profileImage);
      }
      return { userProfile, imgBuffer };
    } catch (error: unknown) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in company getUserProfile: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };
}

export default CompanyServices;
