import { Model } from "mongoose";
import { IChatRepository } from "../Interfaces/chat_repository_interface";
import { IChat, IMessage } from "../Models/chatModel";
import { IUser, ICompany } from "../Interfaces/common_interface";
import CustomError from "../Utils/customError";
import HttpStatusCode from "../Enums/httpStatusCodes";
import CompanyModel from "../Models/companyModel";
import UserModel from "../Models/userModel";

class ChatRepository implements IChatRepository {
  private chatModel: Model<IChat>;
  private userModel: Model<IUser>;  
  private companyModel: Model<ICompany>;

  constructor(chatModel: Model<IChat>, userModel: Model<IUser>, companyModel: Model<ICompany>) {
    this.chatModel = chatModel;
    this.userModel = userModel;
    this.companyModel = companyModel;
  }

  findUserChatHistory = async (userId: string): Promise<IChat[]> => {
    try {
      // First get all chats for this user
      const chats = await this.chatModel
        .find({ user_id: userId })
        .sort({ "messages.timestamp": -1 }); // Sort by latest message

      // Get all unique company IDs
      const companyIds = [...new Set(chats.map((chat) => chat.company_id))];

      // Fetch all relevant company details in one query
      const companies = await this.companyModel.find({
        company_id: { $in: companyIds },
      });

      // Map company details to chats
      const enrichedChats = chats.map((chat) => {
        const company = companies.find(
          (c) => c.company_id.toString() === chat.company_id.toString()
        );
        const lastMessage = chat.messages[chat.messages.length - 1];

        return {
          _id: chat._id,
          user_id: chat.user_id,
          company_id: chat.company_id,
          messages: chat.messages,
          lastMessage: lastMessage?.content || "",
          lastMessageTime: lastMessage?.timestamp || new Date(),
          companyName: company?.name || "Unknown Company",
          companyAvatar: company?.profileImage || "",
        };
      });

      console.log("Enriched user chats:", enrichedChats);
      return enrichedChats;
    } catch (error: unknown) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in chat findUserChatHistory: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  findCompanyChatHistory = async (companyId: string): Promise<IChat[]> => {
    try {
      // First get all chats for this company
      const chats = await this.chatModel
        .find({ company_id: companyId })
        .sort({ "messages.timestamp": -1 }); // Sort by latest message

      // Get all unique user IDs
      const userIds = [...new Set(chats.map((chat) => chat.user_id))];

      // Fetch all relevant user details in one query
      const users = await this.userModel.find({ user_id: { $in: userIds } });

      // Map user details to chats
      const enrichedChats = chats.map((chat) => {
        const user = users.find(
          (u) => u.user_id.toString() === chat.user_id.toString()
        );
        const lastMessage = chat.messages[chat.messages.length - 1];

        return {
          _id: chat._id,
          user_id: chat.user_id,
          company_id: chat.company_id,
          messages: chat.messages,
          lastMessage: lastMessage?.content || "",
          lastMessageTime: lastMessage?.timestamp || new Date(),
          userName: user?.firstName || "Unknown User",
          userAvatar: user?.profileImage || "",
        };
      });

      console.log("Enriched company chats:", enrichedChats);
      return enrichedChats;
    } catch (error: unknown) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in chat findCompanyChatHistory: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  saveMessage = async (messageData: IMessage): Promise<IMessage> => {
    try {
      const chat = await this.chatModel.findOneAndUpdate(
        { user_id: messageData.user_id, company_id: messageData.company_id },
        { $push: { messages: messageData } },
        { new: true, upsert: true }
      );
      console.log("saveMessages", chat.messages[chat.messages.length - 1]);

      return chat.messages[chat.messages.length - 1]; // Return the last message
    } catch (error: unknown) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in chat saveMessage: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  createChat = async (chatData: IChat): Promise<IChat> => {
    try {
      return await this.chatModel.create(chatData);
    } catch (error: unknown) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in chat createChat: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };
}

export default ChatRepository;
