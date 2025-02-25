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
import chatRoutes from "./Routes/chatRoutes";
import errorHandler from "./Middleware/errorHandler";
import subscriptionRoutes from "./Routes/subscriptionRoutes";

dotenv.config();

const PORT = process.env.PORT || 3000;

database_connection();

const allowedOrigins = [
  "http://localhost:5173",
  "https://next-way-frontend.vercel.app",
  "https://next-way-frontend-fvstzp8b0-jyothis-tencys-projects.vercel.app",
  /\.vercel\.app$/,
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.some((allowedOrigin) => origin.match(allowedOrigin))) {
        return callback(null, true);
      } else {
        return callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));

app.use("/data/user", userRoutes);
app.use("/data/company", companyRoutes);
app.use("/data/admin", adminRoutes);
app.use("/data/chat", chatRoutes);
app.use("/data/subscribe", subscriptionRoutes);

app.use(errorHandler);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
