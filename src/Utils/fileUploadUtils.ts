import { s3 } from "../Config/awsConfig";
import { File } from "../Models/fileUploadModel";
import { IUploadFileRequest } from "../Interfaces/common_interface";
import HttpStatusCode from "../Enums/httpStatusCodes";
import CustomError from "./customError";

class FileService {
  async uploadFile(file: IUploadFileRequest["file"]): Promise<string> {
    // Directly use the buffer from Multer, no need to save locally
    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME as string, // Ensure you have your bucket name in the .env file
      Key: `uploads/${Date.now()}-${file.originalname}`,
      Body: file.buffer, // Use the buffer directly
      ContentType: file.mimetype,
    };

    try {
      const data = await s3.upload(params).promise();

      // Save the file URL in MongoDB (optional)
      const fileRecord = new File({ filePath: data.Location });
      await fileRecord.save();

      return params.Key; // Return the file URL from S3
    } catch (error: unknown) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in FileService uploadFile: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }
  async getFile(key: string): Promise<Buffer> {
    console.log("S3 getFile");
    console.log(key);
    
    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME as string,
      Key: key,
    };

    try {
      const data = await s3.getObject(params).promise();
      if (data.Body) {
        console.log("data.Body");

        return data.Body as Buffer; // Return the file content as a Buffer
      } else {
        console.log("File not found in S3.");
        throw new Error("File not found in S3.");
      }
    } catch (error: unknown) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in FileService getFile: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }
}

export default FileService;
