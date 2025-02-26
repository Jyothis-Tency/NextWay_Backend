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
  "https://next-way-frontend.vercel.app",
  "http://localhost:5173",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
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
