import { Server } from "socket.io";
import http from "http";

let io: Server;

export const initializeSocket = (server: http.Server) => {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:5173", // Allow requests from the frontend
      methods: ["GET", "POST"], // Allowed methods
      credentials: true, // If you need to share cookies
    },
  });

  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);
    socket.on("disconnect", (reason) => {
      console.log("User disconnected:", reason);
    });
  });
};

export const getSocketInstance = () => {
  if (!io) {
    throw new Error("Socket.IO not initialized. Call initializeSocket first.");
  }
  return io;
};
