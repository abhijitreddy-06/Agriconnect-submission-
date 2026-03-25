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
    user: {
      id: user.id,
      username,
      phone,
      role,
      delivery_address: null,
      profileComplete: false,
    },
    tokens: {
      accessToken,
      refreshToken,
    },
  };
};

export const login = async ({ phone, password, role }) => {
  const user = await AuthModel.findByPhoneAndRole(phone, role);
  if (!user) {
    const existingUser = await AuthModel.findByPhone(phone);
    if (existingUser && existingUser.role !== role) {
      throw new AppError(
        `This account is already created as ${existingUser.role}. Please log in as ${existingUser.role}.`,
        409
      );
    }

    throw new AppError("Invalid phone or password.", 401);
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new AppError("Invalid phone or password.", 401);
  }

  const { accessToken, refreshToken } = generateTokens(user.id, user.role);

  return {
    user: {
      id: user.id,
      username: user.username,
      phone,
      role: user.role,
      delivery_address: user.delivery_address || null,
      profileComplete: Boolean(user.delivery_address),
    },
    tokens: {
      accessToken,
      refreshToken,
    },
  };
};

export const refresh = async (refreshToken) => {
  if (!refreshToken) {
    throw new AppError("Refresh token is required.", 400);
  }

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

  const row = await AuthModel.findById(decoded.userId);
  if (!row) {
    throw new AppError("User not found.", 401);
  }

  return {
    user: {
      id: row.id,
      username: row.username,
      phone: row.phone_no,
      role: row.role,
      delivery_address: row.delivery_address || null,
      profileComplete: Boolean(row.delivery_address),
    },
    tokens: {
      accessToken,
      refreshToken: newRefreshToken,
    },
  };
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
    profileComplete: Boolean(row.delivery_address),
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
    profileComplete: Boolean(row.delivery_address),
  };
};
