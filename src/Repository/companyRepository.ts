import { Model, Types } from "mongoose";
import { ICompanyRepository } from "../Interfaces/company_repository_interface";
import { ICompany, IJobApplication } from "../Interfaces/common_interface";
import { IJobPost } from "../Interfaces/common_interface";

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
      console.log(`Error in findByEmail at seekerRepository : ${error}`);

      throw error;
    }
  };

  register = async (seekerData: ICompany): Promise<ICompany> => {
    try {
      return await this.company.create(seekerData);
    } catch (error) {
      console.log(`Error in register at seekerRepository : ${error}`);
      throw error;
    }
  };

  updatePassword = async (
    email: string,
    password: string
  ): Promise<ICompany> => {
    try {
      console.log("updatePassword - ", email, password);

      const updatedSeeker = await this.company.findOneAndUpdate(
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

  getCompanyById = async (company_id: string): Promise<ICompany | null> => {
    try {
      const company = await this.company.findOne({ company_id: company_id });

      if (!company) {
        throw new Error("Company not found");
      }
      return company;
    } catch (error) {
      throw error;
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
      if (updatedCompany.modifiedCount === 0) {
        throw new Error("company not updated");
      }
      return true;
    } catch (error) {
      throw error;
    }
  };

  // createJobPost = async (jobPostData: IJobPost): Promise<boolean> => {
  //   try {
  //     const newJobPost = await this.jobPosts.create(jobPostData);
  //     if (!newJobPost) {
  //       throw new Error("error occurred while creating new job post");
  //     }
  //     return true;
  //   } catch (error) {
  //     throw error;
  //   }
  // };

  createOrUpdateJobPost = async (jobPostData: IJobPost): Promise<boolean> => {
    try {
      const upsertedJobPost = await this.jobPosts.findOneAndUpdate(
        { _id: jobPostData._id || new Types.ObjectId() },
        { $set: jobPostData },
        { upsert: true, new: true }
      );

      if (!upsertedJobPost) {
        throw new Error(
          "error occurred while creating or updating the job post"
        );
      }
      return true;
    } catch (error) {
      throw error;
    }
  };

  // getJobsByCompany_Id = async (company_id: string): Promise<IJobPost[]> => {
  //   try {
  //     const jobPostsData = await this.jobPosts.find({
  //       company_id: company_id,
  //     });
  //     console.log(`jobPostsData - ${jobPostsData}`);
  //     if (!jobPostsData) {
  //       throw new Error("jobs not fount");
  //     }
  //     return jobPostsData;
  //   } catch (error) {
  //     console.log(
  //       `Error in getJobsByCompany_Id at companyRepository - ${error}`
  //     );
  //     throw error;
  //   }
  // };

  getAllJobs = async (): Promise<IJobPost[]> => {
    try {
      const jobPostsData = await this.jobPosts.find(); // Fetch all job posts
      console.log(`jobPostsData - ${jobPostsData}`);
      return jobPostsData;
    } catch (error) {
      console.log(`Error in getAllJobs at companyRepository - ${error}`);
      throw error;
    }
  };

  getJobPostById = async (_id: string): Promise<IJobPost | null> => {
    try {
      const jobPostData = await this.jobPosts.findOne({
        _id: _id,
      });
      console.log(`jobPostsData - ${jobPostData}`);
      if (!jobPostData) {
        throw new Error("job is not fount");
      }
      return jobPostData;
    } catch (error) {
      console.log(
        `Error in getJobsByCompany_Id at companyRepository - ${error}`
      );
      throw error;
    }
  };
  deleteJobPost = async (_id: string): Promise<boolean> => {
    try {
      const result = await this.jobPosts.deleteOne({
        _id: _id,
      });
      if (result.deletedCount !== 1) {
        throw new Error("job post not deleted");
      }
      return true;
    } catch (error) {
      console.log(
        `Error in getJobsByCompany_Id at companyRepository - ${error}`
      );
      throw error;
    }
  };

  jobApplicationsByCompanyId = async (
    company_id: string
  ): Promise<IJobApplication[]> => {
    try {
      const jobApplications = await this.jobApplication.find({
        company_id: company_id,
      });
      if (!jobApplications) {
        throw new Error("there is no job application in this company");
      }
      return jobApplications;
    } catch (error) {
      throw error;
    }
  };
  //   getAllJobPost = async (userId: string): Promise<IJobPost[]> => {
  //     try {
  //       const company = await this.company
  //         .findOne({ user_id: userId }) // Find the company by userId
  //         .populate({
  //           path: "jobPosts", // Populate the jobPosts field
  //           model: "JobPost", // Reference the JobPost model
  //         });

  //       if (!company || !company.jobPosts) {
  //         return []; // Return an empty array if no company or no jobPosts found
  //       }

  //       const populatedJobPosts: IJobPost[] = company.jobPosts as IJobPost[]; // Store populated jobPosts into a variable

  //       console.log(populatedJobPosts); // Log the populated job posts if needed
  //       return populatedJobPosts; // Return the variable
  //     } catch (error) {
  //       console.log(`Error in getAllJobPost at recruiterRepository: ${error}`);
  //       throw error;
  //     }
  //   };

  //   findByTitle = async (title: string): Promise<IJobPost | null> => {
  //     try {
  //       return await this.jobPost.findOne({ title });
  //     } catch (error) {
  //       console.log(`Error in findByTitle at recruiterRepository : ${error}`);
  //       throw error;
  //     }
  //   };

  //   findCompany = async (name: string): Promise<ICompany | null> => {
  //     try {
  //       return await this.company.findOne({ name });
  //     } catch (error) {
  //       console.log(`Error in findByName at recruiterRepository: ${error}`);
  //       throw error;
  //     }
  //   };

  //   createJob = async (jobData: IJobPost, userId: string): Promise<boolean> => {
  //     try {
  //       console.log(
  //         `jobData in createJob at recruiterRepository: ${JSON.stringify(
  //           jobData
  //         )}`
  //       );

  //       // Create the new job post using this.jobPost

  //       // Find the company associated with the userId using this.company
  //       const company = await this.company.findOne({ user_id: userId });

  //       if (!company) {
  //         throw new Error("Company not found for the user.");
  //       }

  //       jobData.postedBy = userId; // Assign userId (UUID)
  //       jobData.company = company._id;

  //       const newJobPost = new this.jobPost(jobData);
  //       await newJobPost.save();

  //       // Add the newly created job post ObjectId to the company's jobPosts array
  //       company.jobPosts.push(newJobPost._id);

  //       // Save the company document with the updated jobPosts
  //       await company.save();

  //       return true;
  //     } catch (error) {
  //       console.log(`Error in createJob at recruiterRepository : ${error}`);
  //       throw error;
  //     }
  //   };

  //   createCompany = async (
  //     companyData: ICompany,
  //     userId: string
  //   ): Promise<boolean> => {
  //     try {
  //       console.log(
  //         `companyData in create company at recruiter repository: ${JSON.stringify(
  //           companyData
  //         )}`
  //       );
  //       const companyWithUserId = { ...companyData, user_id: userId };
  //       // Saving the company data into the database
  //       await this.company.create(companyWithUserId);
  //       return true; // Returning true if company was created successfully
  //     } catch (error) {
  //       console.log(`Error in createCompany at recruiterRepository: ${error}`);
  //       throw error; // Throwing the error if something goes wrong
  //     }
  //   };

  //   companyDetails = async (user_id: string): Promise<ICompany | null> => {
  //     try {
  //       const company = await this.company.findOne({
  //         user_id: user_id, // Matches user_id in employees
  //       });

  //       return company;
  //     } catch (error) {
  //       console.error("Error in getCompanyByUserIdFromDB repository:", error);
  //       throw error;
  //     }
  //   };
}

export default CompanyRepository;
