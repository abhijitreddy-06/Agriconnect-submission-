export const sendResponse = (res, status, message, data = null) => {
  return res.status(status).json({
    success: status >= 200 && status < 300,
    message,
    data,
  });
};

export default sendResponse;
