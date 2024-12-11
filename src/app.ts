import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import database_connection from "./Config/database_config";
import seekerRoutes from "./Routes/seekerRoutes";
import cors from "cors";
import companyRoutes from "./Routes/companyRoutes";
import adminRoutes from "./Routes/AdminRoutes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

database_connection();

app.use(cors({ origin: "http://localhost:5173", credentials: true }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));

app.use("/data/seeker", seekerRoutes);
app.use("/data/company",companyRoutes)
app.use("/data/admin",adminRoutes)

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
