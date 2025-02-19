import { IChatRepository } from "../Interfaces/chat_repository_interface";
import { IMessage, IChat } from "../Models/chatModel";
import { IChatServices } from "../Interfaces/chat_service_interface";
import CustomError from "../Utils/customError";
import HttpStatusCode from "../Enums/httpStatusCodes";

class ChatServices implements IChatServices {
  private chatRepository: IChatRepository;

  constructor(chatRepository: IChatRepository) {
    this.chatRepository = chatRepository;
  }

  getUserChatHistory = async (userId: string): Promise<IChat[]> => {
    try {
      return await this.chatRepository.findUserChatHistory(userId);
    } catch (error: unknown) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in chat getUserChatHistory: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };
  getCompanyChatHistory = async (companyId: string): Promise<IChat[]> => {
    try {
      return await this.chatRepository.findCompanyChatHistory(companyId);
    } catch (error: unknown) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in chat getCompanyChatHistory: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  sendMessage = async (messageData: IMessage): Promise<IMessage> => {
    try {
      return await this.chatRepository.saveMessage(messageData);
    } catch (error: unknown) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in chat sendMessage: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  createChat = async (userId: string, companyId: string): Promise<IChat> => {
    try {
      const newChat: IChat = {
        user_id: userId,
        company_id: companyId,
        messages: [],
      };
      return await this.chatRepository.createChat(newChat);
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

export default ChatServices;
