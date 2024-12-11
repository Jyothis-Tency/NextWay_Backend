import mongoose, { Schema, Document } from "mongoose";
import { IFile } from "../Interfaces/common_interface";

const fileSchema: Schema<IFile> = new Schema({
  filePath: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
});

const File = mongoose.model<IFile>("File", fileSchema);

export { File, IFile };
