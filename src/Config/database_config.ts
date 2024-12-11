import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const mongoString = process.env.MONGO_URL;
console.log(mongoString);

const database_connection = async (): Promise<void> => {
  try {
    await mongoose.connect(mongoString as string);
    console.log("Database Connect");
  } catch (error) {
    console.error("Database not connect", error);
  }
};

export default database_connection;
