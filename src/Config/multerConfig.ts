import multer from "multer";

const storage = multer.memoryStorage(); // Use memory storage to avoid saving files locally

// File filter to restrict file types
const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: Function
) => {
const allowedMimeTypes = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "application/rtf",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/zip",
  "application/x-7z-compressed",
  "image/jpeg", // JPEG images
  "image/png", // PNG images
  "image/gif", // GIF images
  "image/webp", // WEBP images
  "image/bmp", // BMP images
  "image/tiff", // TIFF images
  "image/svg+xml", // SVG images
];


  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true); // Accept file
  } else {
    cb(new Error("Invalid file type. Only documents are allowed."));
  }
};

// Configure Multer
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Limit file size to 10MB
  fileFilter,
});

export { upload };
