import AppError from "../utils/AppError.js";
import { verifyAccessToken } from "../utils/tokenUtils.js";

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new AppError("Missing or invalid authorization header.", 401));
  }

  try {
    const token = authHeader.slice(7);
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
