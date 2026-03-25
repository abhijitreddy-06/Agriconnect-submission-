import catchAsync from "../../utils/catchAsync.js";
import * as ChatService from "./chat.service.js";
import sendResponse from "../../utils/sendResponse.js";

export const getMessages = catchAsync(async (req, res) => {
  const data = await ChatService.getMessages(req.user.userId, req.params.orderId);
  return sendResponse(res, 200, "Chat messages fetched successfully.", data);
});

export const getChatInfo = catchAsync(async (req, res) => {
  const data = await ChatService.getChatInfo(req.user.userId, req.params.orderId);
  return sendResponse(res, 200, "Chat metadata fetched successfully.", data);
});

export const sendMessage = catchAsync(async (req, res) => {
  const data = await ChatService.sendMessage(
    req.user.userId,
    req.user.role,
    req.params.orderId,
    req.body?.message
  );

  return sendResponse(res, 201, "Message sent successfully.", data);
});
