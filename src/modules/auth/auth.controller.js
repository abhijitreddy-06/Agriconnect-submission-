import catchAsync from "../../utils/catchAsync.js";
import * as AuthService from "./auth.service.js";
import sendResponse from "../../utils/sendResponse.js";

const ACCESS_COOKIE = "accessToken";
const REFRESH_COOKIE = "refreshToken";

const parseCookieHeader = (cookieHeader = "") => {
  return cookieHeader
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean)
    .reduce((acc, item) => {
      const separatorIndex = item.indexOf("=");
      if (separatorIndex === -1) return acc;
      const key = decodeURIComponent(item.slice(0, separatorIndex).trim());
      const value = decodeURIComponent(item.slice(separatorIndex + 1).trim());
      acc[key] = value;
      return acc;
    }, {});
};

const getCookieOptions = () => {
  const secure = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure,
    sameSite: secure ? "none" : "lax",
    path: "/",
  };
};

const setAuthCookies = (res, tokens) => {
  const baseOptions = getCookieOptions();
  res.cookie(ACCESS_COOKIE, tokens.accessToken, {
    ...baseOptions,
    maxAge: 15 * 60 * 1000,
  });
  res.cookie(REFRESH_COOKIE, tokens.refreshToken, {
    ...baseOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

const clearAuthCookies = (res) => {
  const baseOptions = getCookieOptions();
  res.clearCookie(ACCESS_COOKIE, baseOptions);
  res.clearCookie(REFRESH_COOKIE, baseOptions);
};

const readRefreshToken = (req) => {
  const cookies = parseCookieHeader(req.headers.cookie || "");
  return cookies[REFRESH_COOKIE] || req.body?.refreshToken || null;
};

export const signup = catchAsync(async (req, res) => {
  const result = await AuthService.signup(req.body);
  setAuthCookies(res, result.tokens);
  return sendResponse(res, 201, "Signup successful.", {
    user: result.user,
    session: { authenticated: true },
  });
});

export const login = catchAsync(async (req, res) => {
  const result = await AuthService.login(req.body);
  setAuthCookies(res, result.tokens);
  return sendResponse(res, 200, "Login successful.", {
    user: result.user,
    session: { authenticated: true },
  });
});

export const refresh = catchAsync(async (req, res) => {
  const refreshToken = readRefreshToken(req);
  const result = await AuthService.refresh(refreshToken);
  setAuthCookies(res, result.tokens);
  return sendResponse(res, 200, "Session refreshed.", {
    user: result.user,
    session: { authenticated: true },
  });
});

export const logout = catchAsync(async (req, res) => {
  const refreshToken = readRefreshToken(req);
  await AuthService.logout(refreshToken);
  clearAuthCookies(res);
  return sendResponse(res, 200, "Logged out successfully.", {
    session: { authenticated: false },
  });
});

export const verifyAuth = catchAsync(async (req, res) => {
  const user = await AuthService.verify(req.user.userId);
  return sendResponse(res, 200, "Auth verified.", {
    user,
    session: { authenticated: true },
  });
});

export const updateProfile = catchAsync(async (req, res) => {
  const user = await AuthService.updateProfile(req.user.userId, req.body);
  return sendResponse(res, 200, "Profile updated successfully.", { user });
});
