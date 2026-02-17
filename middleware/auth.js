import { verifyAccessToken } from "../utils/tokenUtils.js";

/**
 * Verify JWT access token from Authorization header
 */
export const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ success: false, error: "Missing or invalid authorization header." });
    }

    const token = authHeader.slice(7);
    const decoded = verifyAccessToken(token);

    req.user = { userId: decoded.userId, role: decoded.role };
    next();
  } catch (error) {
    if (error.message.includes("expired")) {
      return res.status(401).json({ success: false, error: "Token expired.", code: "TOKEN_EXPIRED" });
    }
    return res.status(401).json({ success: false, error: "Unauthorized.", code: "UNAUTHORIZED" });
  }
};

/**
 * Role-based access control middleware.
 * Must be used AFTER verifyToken.
 *
 * @param  {...string} allowedRoles - Roles allowed to access the route (e.g., "farmer", "customer")
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ success: false, error: "Authentication required." });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Required role: ${allowedRoles.join(" or ")}.`,
      });
    }

    next();
  };
};

export default verifyToken;
