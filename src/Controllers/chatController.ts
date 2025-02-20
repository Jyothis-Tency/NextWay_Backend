import { Request, Response, NextFunction } from "express";
import HttpStatusCode from "../Enums/httpStatusCodes";
import { IChatServices } from "../Interfaces/chat_service_interface";
import { log } from "console";

class ChatController {
  private chatService: IChatServices;

  constructor(chatService: IChatServices) {
    this.chatService = chatService;
  }

  /**
   * Retrieves chat history for a specific user
   * @param req Request containing user_id in query params
   * @param res Response with user's chat history
   * @param next Next function for error handling
   */
  fetchUserChatHistory = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { user_id } = req.query;
      const chatHistory = await this.chatService.getUserChatHistory(
        user_id as string
      );
      log("user Chat History in controller", chatHistory);
      res.status(HttpStatusCode.OK).json(chatHistory);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Retrieves chat history for a specific company
   * @param req Request containing company_id in query params
   * @param res Response with company's chat history
   * @param next Next function for error handling
   */
  fetchCompanyChatHistory = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { company_id } = req.query;
      const chatHistory = await this.chatService.getCompanyChatHistory(
        company_id as string
      );
      log("company Chat History in controller", chatHistory);
      res.status(HttpStatusCode.OK).json(chatHistory);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Handles sending a new message
   * @param req Request containing message data in body
   * @param res Response with the newly created message
   * @param next Next function for error handling
   */
  sendMessage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const messageData = req.body;
      const newMessage = await this.chatService.sendMessage(messageData);
      res.status(HttpStatusCode.CREATED).json(newMessage);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Creates a new chat session between a user and a company
   * @param req Request containing userId and companyId in body
   * @param res Response with the newly created chat session
   * @param next Next function for error handling
   */
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
