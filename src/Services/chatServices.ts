import { IChatRepository } from "../Interfaces/chat_repository_interface";
import { IMessage, IChat } from "../Models/chatModel";
import { IChatServices } from "../Interfaces/chat_service_interface";

class ChatServices implements IChatServices {
  private chatRepository: IChatRepository;

  constructor(chatRepository: IChatRepository) {
    this.chatRepository = chatRepository;
  }

  getUserChatHistory = async (
    userId: string,
  ): Promise<IChat[]> => {
    return await this.chatRepository.findUserChatHistory(userId);
  };
  getCompanyChatHistory = async (
    companyId: string,
  ): Promise<IChat[]> => {
    return await this.chatRepository.findCompanyChatHistory(companyId);
  };

  sendMessage = async (messageData: IMessage): Promise<IMessage> => {
    return await this.chatRepository.saveMessage(messageData);
  };

  createChat = async (userId: string, companyId: string): Promise<IChat> => {
    const newChat: IChat = {
      user_id: userId,
      company_id: companyId,
      messages: [],
    };
    return await this.chatRepository.createChat(newChat);
  };
}

export default ChatServices;
