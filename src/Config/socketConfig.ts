import { Server } from "socket.io";
import http from "http";
import ChatServices from "../Services/chatServices";
import ChatRepository from "../Repository/chatRepository";
import ChatModel from "../Models/chatModel";
import UserModel from "../Models/userModel";
import CompanyModel from "../Models/companyModel";
import { log } from "console";
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
  });

  io.on("connection", (socket) => {
    const clientType = socket.handshake.query.clientType as "user" | "company";
    const clientId = socket.handshake.query.clientId as string;

    console.log(
      `A ${clientType} connected:`,
      socket.id,
      `${clientType}_id:`,
      clientId
    );

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
      console.log(`Socket ${socket.id} joined room ${chatRoomName}`);
    });

    socket.on("join:subscription", (userId: string) => {
      const subscriptionRoom = getSubscriptionRoomName(userId);
      socket.join(subscriptionRoom);
      console.log(
        `Socket ${socket.id} joined subscription room ${subscriptionRoom}`
      );
    });

    socket.on("join:company", (companyId: string) => {
      const companyRoom = getCompanyRoomName(companyId);
      socket.join(companyRoom);
      console.log(`Socket ${socket.id} joined company room ${companyRoom}`);
    });

    socket.on("start-interview", (interviewData) => {
      const { roomID, applicationId, user_id } = interviewData;

      // Create a unique room for this interview
      const interviewRoomName = `interview_${applicationId}`;

      // Broadcast to the specific user's room
      const userRoom = `user_${user_id}`;

      // Emit the interview start event to the user
      io.to(userRoom).emit("interview:started", {
        roomID,
        applicationId,
        message: "Interview is ready to start",
      });

      console.log(
        `Interview started for application ${applicationId} in room ${roomID}`
      );
    });

    socket.on("disconnect", (reason) => {
      console.log("User disconnected:", reason);
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
