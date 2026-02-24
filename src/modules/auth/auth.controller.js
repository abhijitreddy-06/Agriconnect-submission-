import catchAsync from "../../utils/catchAsync.js";
import * as AuthService from "./auth.service.js";

export const signup = catchAsync(async (req, res) => {
  const data = await AuthService.signup(req.body);
  return res.status(201).json({ success: true, message: "Signup successful.", ...data });
});

export const login = catchAsync(async (req, res) => {
  const data = await AuthService.login(req.body);
  return res.json({ success: true, ...data });
});

export const refresh = catchAsync(async (req, res) => {
  const data = await AuthService.refresh(req.body.refreshToken);
  return res.json({ success: true, ...data });
});

export const logout = catchAsync(async (req, res) => {
  await AuthService.logout(req.body.refreshToken);
  return res.json({ success: true, message: "Logged out successfully." });
});

export const verifyAuth = catchAsync(async (req, res) => {
  const user = await AuthService.verify(req.user.userId);
  return res.json({ success: true, user });
});

export const updateProfile = catchAsync(async (req, res) => {
  const user = await AuthService.updateProfile(req.user.userId, req.body);
  return res.json({ success: true, message: "Profile updated successfully.", user });
});
