import multer from "multer";
import AppError from "../utils/AppError.js";

const errorHandler = (err, req, res, _next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      err = new AppError("File too large. Maximum size is 5MB.", 413);
    } else {
      err = new AppError(err.message, 400);
    }
  }

  if (err.message && err.message.includes("Only image files")) {
    err = new AppError(err.message, 400);
  }

  const statusCode = err.statusCode || 500;
  const message = err.isOperational
    ? err.message
    : process.env.NODE_ENV === "production"
      ? "Something went wrong."
      : err.message;

  res.status(statusCode).json({
    success: false,
    message,
    data: null,
  });
};

export default errorHandler;
