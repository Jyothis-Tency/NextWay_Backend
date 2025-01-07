import { IMessage, IChat } from "../Models/chatModel";

export interface IChatRepository {
  findUserChatHistory(userId: string): Promise<IChat[]>;
  findCompanyChatHistory(companyId: string): Promise<IChat[]>;
  saveMessage(messageData: IMessage): Promise<IMessage>;
  createChat(chatData: IChat): Promise<IChat>
} 