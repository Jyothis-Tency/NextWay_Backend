import AWS from "aws-sdk";
import dotenv from "dotenv";

dotenv.config();

// Set up AWS S3 configuration
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
  region: process.env.AWS_REGION as string,
});

const s3 = new AWS.S3();

export { s3 };

