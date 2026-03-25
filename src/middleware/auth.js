import AppError from "../utils/AppError.js";
import { verifyAccessToken } from "../utils/tokenUtils.js";

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

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const cookies = parseCookieHeader(req.headers.cookie || "");
  const cookieToken = cookies.accessToken;
  const headerToken = authHeader && authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;
  const token = cookieToken || headerToken;

  if (!token) {
    return next(new AppError("Missing authentication token.", 401));
  }

  try {
    const decoded = verifyAccessToken(token);
    req.user = { userId: decoded.userId, role: decoded.role };
    next();
  } catch (error) {
    if (error.message.includes("expired")) {
      return next(new AppError("Token expired.", 401));
    }
    return next(new AppError("Unauthorized.", 401));
  }
};

export const requireRole = (...allowedRoles) => {
  return (req, _res, next) => {
    if (!req.user || !req.user.role) {
      return next(new AppError("Authentication required.", 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(`Access denied. Required role: ${allowedRoles.join(" or ")}.`, 403)
      );
    }

    next();
  };
};

export default verifyToken;
