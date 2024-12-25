import express from "express";
import dotenv from "dotenv";
import http from "http";
const app = express();
const server = http.createServer(app);
import { initializeSocket } from "./Config/socketConfig";
initializeSocket(server);
import cookieParser from "cookie-parser";
import morgan from "morgan";
import database_connection from "./Config/database_config";
import userRoutes from "./Routes/userRoutes";
import cors from "cors";
import companyRoutes from "./Routes/companyRoutes";
import adminRoutes from "./Routes/AdminRoutes";
import errorHandler from "./Middleware/errorHandler";

dotenv.config();


const PORT = process.env.PORT || 3000;

database_connection();

app.use(cors({ origin: "http://localhost:5173", credentials: true }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));

app.use("/data/user", userRoutes);
app.use("/data/company", companyRoutes);
app.use("/data/admin", adminRoutes);

app.use(errorHandler);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
})