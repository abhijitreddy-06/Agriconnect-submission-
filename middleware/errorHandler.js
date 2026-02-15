import multer from "multer";

const errorHandler = (err, req, res, next) => {
  console.error("Error:", err.message);

  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        success: false,
        error: "File too large. Maximum size is 5MB.",
      });
    }
    return res.status(400).json({
      success: false,
      error: err.message,
    });
  }

  if (err.message && err.message.includes("Only image files")) {
    return res.status(400).json({
      success: false,
      error: err.message,
    });
  }

  const statusCode = err.statusCode || 500;
  const message =
    process.env.NODE_ENV === "production"
      ? "Something went wrong."
      : err.message;

  res.status(statusCode).json({
    success: false,
    error: message,
  });
};

export default errorHandler;
