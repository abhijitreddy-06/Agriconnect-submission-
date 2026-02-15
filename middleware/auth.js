import { verifyAccessToken } from "../utils/tokenUtils.js";

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
      return res.status(401).json({ success: false, error: "Token expired." });
    }
    return res.status(401).json({ success: false, error: "Unauthorized." });
  }
};

export default verifyToken;
