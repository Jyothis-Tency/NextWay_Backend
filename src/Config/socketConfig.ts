import { Server } from "socket.io";
import http from "http";
import CompanyServices from "../Services/companyService";
import CompanyRepository from "../Repository/companyRepository";
import ChatServices from "../Services/chatServices";
import ChatRepository from "../Repository/chatRepository";
import ChatModel from "../Models/chatModel";
import UserModel from "../Models/userModel";
import CompanyModel from "../Models/companyModel";
import JobApplicationModel from "../Models/jobApplicationModel";
import JobPost from "../Models/jobPostModel";
import { log } from "console";
import AdminRepository from "../Repository/adminRepository";
import User from "../Models/userModel";
import SubscriptionPlan from "../Models/subscriptionPlanModel";
import UserRepository from "../Repository/userRepository";
import Company from "../Models/companyModel";
import JobApplication from "../Models/jobApplicationModel";
import SubscriptionDetails from "../Models/subscriptionDetails";
import SubscriptionHistory from "../Models/SubscriptionHistory";
const companyRepository = new CompanyRepository(
  CompanyModel,
  JobPost,
  JobApplicationModel
);
const adminRepository = new AdminRepository(
  CompanyModel,
  User,
  SubscriptionPlan
);
const userRepository = new UserRepository(
  User,
  Company,
  JobApplication,
  SubscriptionDetails,
  SubscriptionPlan,
  JobPost,
  SubscriptionHistory
);
const companyService = new CompanyServices(
  companyRepository,
  adminRepository,
  userRepository
);
const chatRepository = new ChatRepository(ChatModel, UserModel, CompanyModel);
const chatService = new ChatServices(chatRepository);

let io: Server;

interface ConnectedClient {
  type: "user" | "company";
  id: string;
}

export const initializeSocket = (server: http.Server) => {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingInterval: 10000, // Send a ping every 10 seconds
    pingTimeout: 5000,
  });

  io.on("connection", (socket) => {
    const clientType = socket.handshake.query.clientType as "user" | "company";
    const clientId = socket.handshake.query.clientId as string;

    // console.log(
    //   `A ${clientType} connected:`,
    //   socket.id,
    //   `${clientType}_id:`,
    //   clientId
    // );

    // Join client to their personal room
    const personalRoom = `${clientType}_${clientId}`;
    socket.join(personalRoom);

    socket.on("sendMessage", async (messageData) => {
      console.log("socket sendMessage:", messageData);

      const newMessage = await chatService.sendMessage(messageData);

      // Create a unique chat room name
      const chatRoomName = getChatRoomName(
        messageData.user_id,
        messageData.company_id
      );

      // Emit to the specific chat room
      io.to(chatRoomName).emit("receiveMessage", newMessage);
    });

    socket.on("joinChat", (chatData) => {
      const chatRoomName = getChatRoomName(
        chatData.user_id,
        chatData.company_id
      );
      socket.join(chatRoomName);
      // console.log(`Socket ${socket.id} joined room ${chatRoomName}`);
    });

    socket.on("join:subscription", (userId: string) => {
      const subscriptionRoom = getSubscriptionRoomName(userId);
      socket.join(subscriptionRoom);
      // console.log(
      //   `Socket ${socket.id} joined subscription room ${subscriptionRoom}`
      // );
    });

    socket.on("join:company", (companyId: string) => {
      const companyRoom = getCompanyRoomName(companyId);
      socket.join(companyRoom);
      // console.log(`Socket ${socket.id} joined company room ${companyRoom}`);
    });

    socket.on("start-interview", (interviewData) => {
      // console.log("Interview started in socketConfig:", interviewData);
      const { roomID, applicationId, user_id, companyName } = interviewData;

      // Create a unique room for this interview
      const interviewRoomName = `interview_${applicationId}`;

      // Broadcast to the specific user's room
      const userRoom = `user_${user_id}`;

      // Emit the interview start event to the user
      io.to(userRoom).emit("interview:started", {
        roomID,
        applicationId,
        companyName,
        message: "Interview is ready to start",
      });

      // console.log(
      //   `Interview started for application ${applicationId} in room ${roomID}`
      // );
    });

    socket.on("user:leave", (data) => {
      console.log("User left event received:", data);
      const { roomID, userId } = data;
      // Notify company that user has left
      const userRoom = `user_${userId}`;
      io.to(userRoom).emit("user:left", {
        roomID,
        userId,
      });
    });

    socket.on("user:in-interview", (data) => {
      console.log("user:in-interview on on on on on on");
      console.log("User in interview event received:", data);
      const { userId, companyId, roomID } = data;
      // Notify company that user is in the interview
      const companyRoom = getCompanyRoomName(userId);
      io.emit("user:in-interview-going", {
        userId,
        companyId,
        roomID,
      });
    });

    socket.on("end-interview", async (interviewData) => {
      console.log("Interview ended in socketConfig:", interviewData);

      const { roomID, applicationId, user_id, startTime } = interviewData;
      console.log("startTime", startTime);
      const userRoom = `user_${user_id}`;

      io.to(userRoom).emit("interview:end", roomID);

      // Broadcast to the specific user's room
      await companyService.setInterviewDetails(applicationId, {
        interviewStatus: "conducted",
        dateTime: startTime,
        message: "Interview conducted successfully",
      });
      // Emit the interview end event to the user
      io.to(userRoom).emit("interview:ended");

      console.log(`Interview ended for application ${applicationId}`);
    });

    socket.on("disconnect", (reason) => {
      console.log("User disconnected:", reason);
      if (clientType === "user") {
        socket.leave(getSubscriptionRoomName(clientId));
      }
    });
  });
};

// Helper function to create consistent room names
function getChatRoomName(userId: string, companyId: string): string {
  return `chat_${userId}_${companyId}`;
}

export const getSubscriptionRoomName = (userId: string): string => {
  return `subscription_${userId}`;
};

export const getCompanyRoomName = (companyId: string): string => {
  return `${companyId}`;
};

export const emitNewJobNotification = (notification: {
  job_id: string;
  title: string;
  company: string;
  location: string;
}) => {
  log("Emitting new job notification:", notification);
  const io = getSocketInstance();
  io.emit("notification:newJob", notification);
};

export const emitApplicationStatusUpdate = (
  notification: {
    applicationId: string;
    jobId: string;
    companyName: string;
    jobTitle: string;
    status: string;
  },
  user_id: string
) => {
  log("Emitting application status update:", notification);
  const io = getSocketInstance();

  const roomName = `user_${user_id}`;

  io.to(roomName).emit("notification:applicationStatusUpdate", notification);
};

export const emitNewApplicationNotification = (notification: {
  applicationId: string;
  companyId: string;
  jobId: string;
  jobTitle: string;
  applicantName: string;
  applicantEmail: string;
}) => {
  log("Emitting new application notification:", notification);
  const io = getSocketInstance();

  io.emit("notification:newApplication", notification);
};

export const getSocketInstance = () => {
  if (!io) {
    throw new Error("Socket.IO not initialized. Call initializeSocket first.");
  }
  return io;
};

export const emitVideoCallInvitation = (notification: {
  applicationId: string;
  userId: string;
  companyId: string;
  roomId: string;
}) => {
  log("Emitting video call invitation:", notification);
  const io = getSocketInstance();

  const userRoom = getSubscriptionRoomName(notification.userId);
  io.to(userRoom).emit("notification:videoCallInvite", notification);
};
