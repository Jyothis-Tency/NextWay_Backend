import { Document, Schema, model } from "mongoose";

export interface IMessage {
  sender: string;
  
  content: string;
  timestamp: Date;
  user_id: string;
  company_id: string;
}

export interface IChat {
  user_id: string;
  company_id: string;
  messages: IMessage[];
  lastMessage?: string;
  lastMessageTime?: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    sender: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    user_id: {
      type: String,
      required: true,
    },
    company_id: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const ChatSchema = new Schema<IChat>(
  {
    user_id: {
      type: String,
      required: true,
    },
    company_id: {
      type: String,
      required: true,
    },
    messages: [messageSchema],
    lastMessage: String,
    lastMessageTime: Date,
  },
  {
    timestamps: true,
  }
);

ChatSchema.index({ user_id: 1, company_id: 1 });

const ChatModel = model<IChat>("Chat", ChatSchema);

export default ChatModel;
