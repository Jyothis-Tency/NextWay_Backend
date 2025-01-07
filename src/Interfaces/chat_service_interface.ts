import { IMessage, IChat } from "../Models/chatModel";

export interface IChatServices {
  getUserChatHistory(userId: string): Promise<IChat[]>;
  getCompanyChatHistory(companyId: string): Promise<IChat[]>;
  sendMessage(messageData: IMessage): Promise<IMessage>;
  createChat(userId: string, companyId: string): Promise<IChat>
}
