import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import { OAuth2Client } from "google-auth-library";
import {
  ICleanUserData,
  IUser,
  IJobPost,
  ICompany,
  IJobApplication,
  RazorpayOrder,
  RazorpayOrderReceipt,
  ISubscriptionDetails,
  ISubscriptionPlan,
} from "../Interfaces/common_interface";
import { IUserRepository } from "../Interfaces/user_repository_interface";
import { ICompanyRepository } from "../Interfaces/company_repository_interface";
import { IAdminRepository } from "../Interfaces/admin_repository_interface";
import { IUserServices } from "../Interfaces/user_service_interface";
import redisClient from "../Utils/redisUtils";
import otpSender from "../Utils/otpUtils";
import { createAccessToken, createRefreshToken } from "../Config/jwtConfig";
import FileService from "../Utils/fileUploadUtils";
import { ObjectId } from "mongodb";
import crypto from "crypto";
import Razorpay from "razorpay";
import razorpayInstance from "../Config/razorpayConfig";
import CustomError from "../Utils/customError";
import HttpStatusCode from "../Enums/httpStatusCodes";
import { Server } from "socket.io";
import {
  getCompanyRoomName,
  emitNewApplicationNotification,
} from "../Config/socketConfig";
import { verifyGoogleToken } from "../Utils/googleAuth";
import dotenv from "dotenv";
dotenv.config();
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

class UserServices implements IUserServices {
  private userRepository: IUserRepository;
  private companyRepository: ICompanyRepository;
  private adminRepository: IAdminRepository;
  private userData: IUser | null = null;
  private jobPosts: IJobPost | null = null;
  private OTP: string | null = null;
  private OTP_expiringTime: Date | null = null;
  private fileService: FileService;
  private io: Server;
  private client: OAuth2Client;

  constructor(
    userRepository: IUserRepository,
    companyRepository: ICompanyRepository,
    adminRepository: IAdminRepository,
    io: Server
  ) {
    this.userRepository = userRepository;
    this.companyRepository = companyRepository;
    this.adminRepository = adminRepository;
    this.fileService = new FileService();
    this.io = io;
    this.client = new OAuth2Client(GOOGLE_CLIENT_ID as string);
  }

  loginUser = async (
    email: string,
    password: string
  ): Promise<{
    userData: ICleanUserData;
    accessToken: string;
    refreshToken: string;
  }> => {
    try {
      let user = await this.userRepository.findByEmail(email);
      if (!user) {
        throw new CustomError("Email not found", HttpStatusCode.NOT_FOUND);
      }
      if (user.isBlocked) {
        throw new CustomError(
          "User is blocked by admin",
          HttpStatusCode.FORBIDDEN
        );
      }

      const comparedPassword = await bcrypt.compare(
        password,
        user.password as string
      );
      if (!comparedPassword) {
        throw new CustomError("Invalid password", HttpStatusCode.UNAUTHORIZED);
      }

      let imgBuffer;
      if (user.profileImage) {
        imgBuffer = await this.fileService.getFile(user.profileImage);
      }

      let imageBase64 = "";
      if (imgBuffer) {
        imageBase64 = `data:image/jpeg;base64,${imgBuffer.toString("base64")}`;
      }

      const accessToken = createAccessToken(user.user_id, user.role);
      const refreshToken = createRefreshToken(user.user_id, user.role);
      console.log("accessToken", accessToken);
      console.log("refreshToken", refreshToken);

      const userData = {
        user_id: user?.user_id,
        firstName: user?.firstName,
        lastName: user?.lastName,
        email: user?.email,
        phone: user?.phone,
        isBlocked: user?.isBlocked,
        profileImage: imageBase64,
        location: user?.location,
        skills: user?.skills,
        accessToken: accessToken,
        refreshToken: refreshToken,
        role: user.role,
        isSubscribed: user.isSubscribed,
        subscriptionFeatures: user.subscriptionFeatures,
      };

      return { userData, accessToken, refreshToken };
    } catch (error: unknown) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in loginUser: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  handleGoogleAuth = async (
    token: string
  ): Promise<Partial<ICleanUserData>> => {
    try {
      const payload = await verifyGoogleToken(token);
      if (!payload) {
        throw new CustomError(
          `Invalid Google Token`,
          HttpStatusCode.INTERNAL_SERVER_ERROR
        );
      }
      let user = await this.userRepository.findByGoogleId(payload.sub);
      // if (user) {
      //   user.googleId = payload.sub ? payload.sub : "";
      // }
      // user?.save();
      const uuidCode = uuidv4();
      const hash = crypto.createHash("sha256").update(uuidCode).digest("hex");
      const objectIdHex = hash.substring(0, 24);
      const obId = new ObjectId(objectIdHex);
      if (!user) {
        const userData = {
          firstName: payload.given_name || "",
          lastName: payload.family_name || "",
          email: payload?.email || "",
          phone: "",
          password: hash,
          confirmPassword: hash,
          user_id: obId,
          googleId: payload.sub,
        };
        console.log("new user userDat in googleauth", userData);

        user = await this.userRepository.register(userData);
        if (!user) {
          throw new CustomError(
            "Failed to register user",
            HttpStatusCode.BAD_REQUEST
          );
        }
      }
      const accessToken = createAccessToken(user?.user_id || "", "user");
      const refreshToken = createRefreshToken(user?.user_id || "", "user");
      let imageBase64 = "";
      if (user.profileImage) {
        const imgBuffer = await this.fileService.getFile(user.profileImage);
        if (imgBuffer) {
          imageBase64 = `data:image/jpeg;base64,${imgBuffer.toString(
            "base64"
          )}`;
        }
      }
      console.log("accessToken", accessToken);
      console.log("refreshToken", refreshToken);
      const userData = {
        user_id: user?.user_id,
        firstName: user?.firstName,
        lastName: user?.lastName,
        email: user?.email,
        phone: user?.phone,
        isBlocked: user?.isBlocked,
        profileImage: imageBase64 || user.profileImage,
        location: user?.location,
        skills: user?.skills,
        accessToken: accessToken,
        refreshToken: refreshToken,
        role: user?.role,
        isSubscribed: user?.isSubscribed,
        subscriptionFeatures: user?.subscriptionFeatures,
      };
      return userData;
    } catch (error: unknown) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in user handleGoogleAuth: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  registerUser = async (userData: IUser): Promise<boolean> => {
    try {
      const alreadyExists = await this.userRepository.findByEmail(
        userData.email
      );
      if (alreadyExists) {
        throw new CustomError("Email already exists", HttpStatusCode.CONFLICT);
      }

      await redisClient.setEx(
        `${userData.email}:data`,
        300,
        JSON.stringify(userData)
      );
      this.userData = userData;
      const otpSended = await otpSender(userData.email);
      if (!otpSended) {
        throw new CustomError("Failed to send OTP", HttpStatusCode.BAD_REQUEST);
      }
      return true;
    } catch (error: unknown) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in registerUser: ${
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
      const userData: IUser | null = getData ? JSON.parse(getData) : null;

      if (!getOTP) {
        throw new CustomError(
          "OTP expired or doesn't exist",
          HttpStatusCode.BAD_REQUEST
        );
      }
      if (getOTP !== receivedOTP) {
        throw new CustomError("Incorrect OTP", HttpStatusCode.BAD_REQUEST);
      }
      if (!userData) {
        throw new CustomError("User data not found", HttpStatusCode.NOT_FOUND);
      }

      const hashedPassword = await bcrypt.hash(userData.password as string, 10);
      userData.password = hashedPassword;
      const uuidCode = uuidv4();
      const hash = crypto.createHash("sha256").update(uuidCode).digest("hex");
      const objectIdHex = hash.substring(0, 24);
      const obId = new ObjectId(objectIdHex);
      userData.user_id = obId;
      console.log("userData in verifyOTP", userData);

      const registeredUser = await this.userRepository.register(userData);
      if (!registeredUser) {
        throw new CustomError(
          "Failed to register user",
          HttpStatusCode.BAD_REQUEST
        );
      }

      await redisClient.del(`${email}:data`);
      await redisClient.del(`${email}:otp`);
      return true;
    } catch (error: unknown) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in user otpVerification: ${
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
        `Error in user resendOtp: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  forgotPasswordEmail = async (email: string): Promise<boolean> => {
    try {
      let userData = await this.userRepository.findByEmail(email);
      if (!userData) {
        throw new CustomError("Email not found", HttpStatusCode.NOT_FOUND);
      }

      const otpSended = await otpSender(userData.email);
      if (!otpSended) {
        throw new CustomError("Failed to send OTP", HttpStatusCode.BAD_REQUEST);
      }
      return true;
    } catch (error: unknown) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in user forgotPasswordEmail: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  forgotPasswordOTP = async (
    email: string,
    receivedOTP: string
  ): Promise<Boolean> => {
    try {
      const getOTP = await redisClient.get(email);
      if (!getOTP) {
        throw new CustomError(
          "OTP expired or doesn't exist",
          HttpStatusCode.BAD_REQUEST
        );
      }
      if (getOTP !== receivedOTP) {
        throw new CustomError("Incorrect OTP", HttpStatusCode.BAD_REQUEST);
      }
      await redisClient.del(email);
      return true;
    } catch (error: unknown) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in user forgotPasswordOTP: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  forgotPasswordReset = async (
    email: string,
    password: string
  ): Promise<Boolean> => {
    try {
      const hashedPassword = await bcrypt.hash(password as string, 10);
      const updatedUserData = await this.userRepository.updatePassword(
        email,
        hashedPassword
      );

      if (!updatedUserData) {
        throw new CustomError(
          "Failed to update password",
          HttpStatusCode.BAD_REQUEST
        );
      }
      return true;
    } catch (error: unknown) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in user forgotPasswordReset: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  getAllJobPosts = async (): Promise<{
    jobPosts: IJobPost[];
    companies: ICompany[];
  }> => {
    try {
      const jobPosts = await this.companyRepository.getAllJobs();
      if (!jobPosts || jobPosts.length === 0) {
        throw new CustomError("No job posts found", HttpStatusCode.NOT_FOUND);
      }

      const companyIds = Array.from(
        new Set(jobPosts.map((job) => job.company_id))
      );
      const companies = await this.userRepository.getAllCompaniesByIds(
        companyIds
      );
      if (!companies || companies.length === 0) {
        throw new CustomError("No companies found", HttpStatusCode.NOT_FOUND);
      }

      return { jobPosts, companies };
    } catch (error: unknown) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in user getAllJobPosts: ${
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
        `Error in user getUserProfile: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  editUserDetailsService = async (
    user_id: string,
    userData: Partial<IUser>
  ): Promise<IUser> => {
    try {
      const result = await this.userRepository.putUserById(user_id, userData);
      if (!result) {
        throw new CustomError(
          "Failed to update user details",
          HttpStatusCode.BAD_REQUEST
        );
      }
      return result;
    } catch (error: unknown) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in user editUserDetailsService: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  newJobApplication = async (
    applicationData: IJobApplication,
    resumeFile?: Express.Multer.File
  ): Promise<IJobApplication> => {
    try {
      console.log("newJobApplication");
      console.log("resumeFile in newJobApplication", resumeFile);
      const user = await this.userRepository.getUserById(
        applicationData.user_id
      );

      const requiredFields = [
        "firstName",
        "lastName",
        "email",
        "phone",
        "location",
        "bio",
        "skills",
        "preferredLocation",
        "education",
      ];

      if (!user) {
        throw new CustomError("User not found", HttpStatusCode.NOT_FOUND);
      }
      const missingFields = requiredFields.filter(
        (field) =>
          !(user as IUser)[field as keyof IUser] ||
          (user as any)[field as keyof IUser].length === 0
      );
      if (missingFields.length > 0) {
        throw new CustomError(
          `Please complete your profile before applying to jobs. Missing fields: ${missingFields.join(
            ", "
          )}`,
          HttpStatusCode.BAD_REQUEST
        );
      }
      if (!resumeFile) {
        throw new CustomError("resumeFile not found", HttpStatusCode.NOT_FOUND);
      }
      const resumeUrl = await this.fileService.uploadFile(resumeFile);
      if (!resumeUrl) {
        throw new CustomError(
          "Failed to upload resume",
          HttpStatusCode.BAD_REQUEST
        );
      }

      applicationData.resume = resumeUrl;
      const result = await this.userRepository.postJobApplication(
        applicationData
      );

      
      if (!result) {
        throw new CustomError(
          "Failed to save job application",
          HttpStatusCode.BAD_REQUEST
        );
      }

      emitNewApplicationNotification({
        applicationId: result.id,
        companyId: result.company_id,
        jobId: "result.job_id as string",
        jobTitle: result.jobTitle,
        applicantName: user?.firstName + " " + user?.lastName,
        applicantEmail: result.email,
      });
      // this.io.emit("jobApplicationSubmitted", {
      //   message: "You have received new job application",
      //   applicationData: result,
      // });

      return result;
    } catch (error: unknown) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in user newJobApplication: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  updateProfileImg = async (
    user_id: string,
    image?: Express.Multer.File
  ): Promise<boolean> => {
    try {
      if (!image) {
        throw new CustomError("image not found", HttpStatusCode.NOT_FOUND);
      }
      const resumeUrl = await this.fileService.uploadFile(image);
      if (!resumeUrl) {
        throw new CustomError(
          "Failed to upload image",
          HttpStatusCode.BAD_REQUEST
        );
      }

      const result = await this.userRepository.postProfileImg(
        user_id,
        resumeUrl
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
        `Error in user updateProfileImg: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  getSubscriptionHistory = async (
    user_id: string
  ): Promise<ISubscriptionDetails[]> => {
    try {
      const result = await this.userRepository.getSubscriptionHistory(user_id);
      if (!result || result.length === 0) {
        throw new CustomError(
          "No subscription history found",
          HttpStatusCode.NOT_FOUND
        );
      }
      return result;
    } catch (error: unknown) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in user getSubscriptionHistory: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  getCurrentSubscriptionDetail = async (
    user_id: string
  ): Promise<ISubscriptionDetails | null> => {
    try {
      const result = await this.userRepository.getCurrentSubscriptionDetails(
        user_id
      );
      // if (!result) {
      //   throw new CustomError(
      //     "No active subscription found",
      //     HttpStatusCode.NOT_FOUND
      //   );
      // }
      return result;
    } catch (error: unknown) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in user getCurrentSubscriptionDetails: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  getJobApplicationsByUserId = async (
    user_id: string
  ): Promise<IJobApplication[]> => {
    try {
      const applications = await this.userRepository.getJobApplicationsByUserId(
        user_id
      );

      await Promise.all(
        applications
          .filter((application) => application.offerLetter) // Filter companys with profile images
          .map(async (application) => {
            const imageURL = await this.fileService.getFile(
              application.offerLetter as string
            );

            application.offerLetter = `data:application/pdf;base64,${imageURL.toString(
              "base64"
            )}`;
          })
      );

      console.log(applications);
      // if (!applications || applications.length === 0) {
      //   throw new CustomError(
      //     "No job applications found for this user",
      //     HttpStatusCode.NOT_FOUND
      //   );
      // }
      return applications;
    } catch (error: unknown) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in user getJobApplicationsByUserId: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  searchCompany = async (query: string): Promise<ICompany[]> => {
    try {
      return await this.companyRepository.searchByCompanyName(query);
    } catch (error: unknown) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in user searchCompany: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  getAllCompanyProfileImages = async (): Promise<
    {
      company_id: string;
      profileImage: string;
    }[]
  > => {
    try {
      const allCompanies = await this.adminRepository.getAllCompanies();
      if (!allCompanies) {
        return [];
      }

      // Use Promise.all to handle multiple async operations
      const companyImagesWithId = await Promise.all(
        allCompanies
          .filter((company) => company.profileImage) // Filter companys with profile images
          .map(async (company) => {
            const imageURL = await this.fileService.getFile(
              company.profileImage as string
            );
            return {
              company_id: company.company_id.toString(),
              profileImage: `data:image/jpeg;base64,${imageURL.toString(
                "base64"
              )}`,
            };
          })
      );

      return companyImagesWithId;
    } catch (error: unknown) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in user getAllCompanyProfileImages: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  fetchAllCompanyDetails = async (): Promise<ICompany[] | null> => {
    try {
      const companiesData = await this.adminRepository.getAllCompanies();
      const companies = companiesData?.filter(
        (company) =>
          company.isVerified === "accept" || company.isVerified === "pending"
      );
      if (!companiesData) {
        // throw new Error("companies data not found");
        throw new CustomError(
          "companies data not found",
          HttpStatusCode.NOT_FOUND
        );
      }
      return companies || null;
    } catch (error: unknown) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in user fetchAllCompanyDetails: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  getSubscriptionPlans = async (
    plan_id: string
  ): Promise<ISubscriptionPlan | ISubscriptionPlan[]> => {
    try {
      const result = await this.adminRepository.getSubscriptionPlans(plan_id);
      if (!result) {
        throw new CustomError(
          "Error occurred getting subscription plan",
          HttpStatusCode.NOT_FOUND
        );
      }
      return result;
    } catch (error: unknown) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in user getSubscriptionPlans: ${
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
        `Error in user getCompanyDetails: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };
}

export default UserServices;
