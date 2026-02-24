import catchAsync from "../../utils/catchAsync.js";
import * as ChatService from "./chat.service.js";

export const getMessages = catchAsync(async (req, res) => {
  const data = await ChatService.getMessages(req.user.userId, req.params.orderId);
  return res.json({ success: true, data });
});

export const getChatInfo = catchAsync(async (req, res) => {
  const data = await ChatService.getChatInfo(req.user.userId, req.params.orderId);
  return res.json({ success: true, data });
});
