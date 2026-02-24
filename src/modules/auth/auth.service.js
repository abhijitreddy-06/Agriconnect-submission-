import bcrypt from "bcrypt";
import * as AuthModel from "./auth.model.js";
import { generateTokens, verifyRefreshToken } from "../../utils/tokenUtils.js";
import { cacheGet, cacheSet, cacheDel } from "../../config/redis.js";
import AppError from "../../utils/AppError.js";

export const signup = async ({ username, phone, password, role }) => {
  const exists = await AuthModel.findByPhone(phone);
  if (exists) {
    throw new AppError("An account with this phone number already exists.", 409);
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await AuthModel.create(username, phone, hashedPassword, role);

  const { accessToken, refreshToken } = generateTokens(user.id, role);

  return {
    token: accessToken,
    refreshToken,
    userId: user.id,
    username,
    role,
  };
};

export const login = async ({ phone, password, role }) => {
  const user = await AuthModel.findByPhoneAndRole(phone, role);
  if (!user) {
    throw new AppError("Invalid phone or password.", 401);
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new AppError("Invalid phone or password.", 401);
  }

  const { accessToken, refreshToken } = generateTokens(user.id, user.role);

  return {
    token: accessToken,
    refreshToken,
    userId: user.id,
    username: user.username,
    role: user.role,
  };
};

export const refresh = async (refreshToken) => {
  const isBlacklisted = await cacheGet(`blacklist:${refreshToken}`);
  if (isBlacklisted) {
    throw new AppError("Token has been revoked. Please log in again.", 401);
  }

  const decoded = verifyRefreshToken(refreshToken);
  await cacheSet(`blacklist:${refreshToken}`, true, 7 * 24 * 60 * 60);

  const { accessToken, refreshToken: newRefreshToken } = generateTokens(
    decoded.userId,
    decoded.role
  );

  return { token: accessToken, refreshToken: newRefreshToken };
};

export const logout = async (refreshToken) => {
  if (refreshToken) {
    await cacheSet(`blacklist:${refreshToken}`, true, 7 * 24 * 60 * 60);
  }
};

export const verify = async (userId) => {
  const cacheKey = `user:profile:${userId}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return cached;

  const row = await AuthModel.findById(userId);
  if (!row) {
    throw new AppError("User not found.", 401);
  }

  const user = {
    id: row.id,
    username: row.username,
    phone: row.phone_no,
    role: row.role,
    delivery_address: row.delivery_address || null,
  };

  await cacheSet(cacheKey, user, 600);
  return user;
};

export const updateProfile = async (userId, { username, delivery_address }) => {
  const row = await AuthModel.updateProfile(userId, username, delivery_address);
  if (!row) {
    throw new AppError("User not found.", 404);
  }

  await cacheDel(`user:profile:${userId}`);

  return {
    id: row.id,
    username: row.username,
    phone: row.phone_no,
    role: row.role,
    delivery_address: row.delivery_address || null,
  };
};
