import { Request, Response, NextFunction } from "express";
import HttpStatusCode from "../Enums/httpStatusCodes";
import { IChatServices } from "../Interfaces/chat_service_interface";
import { log } from "console";

class ChatController {
  private chatService: IChatServices;

  constructor(chatService: IChatServices) {
    this.chatService = chatService;
  }

  fetchUserChatHistory = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { user_id } = req.query;
      const chatHistory = await this.chatService.getUserChatHistory(user_id as string);
      log("user Chat History in controller", chatHistory);
      res.status(HttpStatusCode.OK).json(chatHistory);
    } catch (error) {
      next(error);
    }
  };
  fetchCompanyChatHistory = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { company_id } = req.query;
      const chatHistory = await this.chatService.getCompanyChatHistory(company_id as string);
      log("company Chat History in controller", chatHistory);
      res.status(HttpStatusCode.OK).json(chatHistory);
    } catch (error) {
      next(error);
    }
  };

  sendMessage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const messageData = req.body;
      const newMessage = await this.chatService.sendMessage(messageData);
      res.status(HttpStatusCode.CREATED).json(newMessage);
    } catch (error) {
      next(error);
    }
  };

  createChat = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId, companyId } = req.body;
      const newChat = await this.chatService.createChat(userId, companyId);
      res.status(HttpStatusCode.CREATED).json(newChat);
    } catch (error) {
      next(error);
    }
  };
}

export default ChatController;
