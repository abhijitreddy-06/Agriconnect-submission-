import bcrypt from "bcrypt";
import pool from "../config/database.js";
import { generateTokens, verifyRefreshToken } from "../utils/tokenUtils.js";
import { cacheSet, cacheDel } from "../config/redis.js";

// POST /api/auth/signup - Create new user account
export const signup = async (req, res) => {
  try {
    const { username, phone, password, role } = req.body;

    // Validation
    if (!username || !phone || !password || !role) {
      return res.status(400).json({
        success: false,
        error: "All fields are required (username, phone, password, role).",
      });
    }

    if (!/^\d{10}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        error: "Phone number must be exactly 10 digits.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: "Password must be at least 6 characters.",
      });
    }

    if (!["farmer", "customer"].includes(role)) {
      return res.status(400).json({
        success: false,
        error: "Role must be 'farmer' or 'customer'.",
      });
    }

    // Check if user already exists
    const existingUser = await pool.query(
      "SELECT 1 FROM users WHERE phone_no = $1",
      [phone]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: "An account with this phone number already exists.",
      });
    }

    // Hash password and insert user
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (username, phone_no, password, role) VALUES ($1, $2, $3, $4) RETURNING id",
      [username, phone, hashedPassword, role]
    );

    const userId = result.rows[0].id;
    const { accessToken, refreshToken } = generateTokens(userId, role);

    return res.status(201).json({
      success: true,
      message: "Signup successful.",
      token: accessToken,
      refreshToken,
      userId,
      username,
      role,
    });
  } catch (error) {
    console.error("Signup Error:", error.message);
    return res.status(500).json({
      success: false,
      error: "Signup failed. Please try again.",
    });
  }
};

// POST /login - Authenticate user
export const login = async (req, res) => {
  try {
    const { phone, password, role } = req.body;

    // Validation
    if (!phone || !password || !role) {
      return res.status(400).json({
        success: false,
        error: "Phone, password, and role are required.",
      });
    }

    if (!["farmer", "customer"].includes(role)) {
      return res.status(400).json({
        success: false,
        error: "Role must be 'farmer' or 'customer'.",
      });
    }

    // Find user
    const result = await pool.query(
      "SELECT id, username, password, role FROM users WHERE phone_no = $1 AND role = $2",
      [phone, role]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: "Invalid phone or password.",
      });
    }

    const user = result.rows[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: "Invalid phone or password.",
      });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id, user.role);

    return res.json({
      success: true,
      token: accessToken,
      refreshToken,
      userId: user.id,
      username: user.username,
      role: user.role,
    });
  } catch (error) {
    console.error("Login Error:", error.message);
    return res.status(500).json({
      success: false,
      error: "Login failed. Please try again.",
    });
  }
};

// POST /refresh - Generate new access token
export const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: "Refresh token is required.",
      });
    }

    // Check if token is blacklisted (logged out)
    const { cacheGet } = await import("../config/redis.js");
    const isBlacklisted = await cacheGet(`blacklist:${refreshToken}`);
    if (isBlacklisted) {
      return res.status(401).json({
        success: false,
        error: "Token has been revoked. Please log in again.",
      });
    }

    const decoded = verifyRefreshToken(refreshToken);

    // Blacklist old refresh token (one-time use rotation)
    const { cacheSet } = await import("../config/redis.js");
    await cacheSet(`blacklist:${refreshToken}`, true, 7 * 24 * 60 * 60);

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(
      decoded.userId,
      decoded.role
    );

    return res.json({
      success: true,
      token: accessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error("Refresh Error:", error.message);
    return res.status(401).json({
      success: false,
      error: "Failed to refresh token. Please log in again.",
    });
  }
};

// POST /api/auth/logout - Blacklist refresh token
export const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      // Blacklist the refresh token in Redis (TTL = 7 days to match token expiry)
      await cacheSet(`blacklist:${refreshToken}`, true, 7 * 24 * 60 * 60);
    }

    return res.json({
      success: true,
      message: "Logged out successfully.",
    });
  } catch (error) {
    console.error("Logout Error:", error.message);
    return res.json({ success: true, message: "Logged out." });
  }
};

// GET /api/auth/verify - Verify current token and return user info (cached)
export const verifyAuth = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Try Redis cache first
    const { cacheGet: cGet, cacheSet: cSet } = await import("../config/redis.js");
    const cacheKey = `user:profile:${userId}`;
    const cached = await cGet(cacheKey);
    if (cached) {
      return res.json({ success: true, user: cached });
    }

    const result = await pool.query(
      "SELECT id, username, phone_no, role FROM users WHERE id = $1",
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, error: "User not found." });
    }

    const user = {
      id: result.rows[0].id,
      username: result.rows[0].username,
      phone: result.rows[0].phone_no,
      role: result.rows[0].role,
    };

    // Cache for 10 minutes
    await cSet(cacheKey, user, 600);

    return res.json({ success: true, user });
  } catch (error) {
    console.error("Verify Error:", error.message);
    return res.status(500).json({ success: false, error: "Verification failed." });
  }
};

// PUT /api/auth/profile - Update user profile
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { username } = req.body;

    if (!username || !username.trim()) {
      return res.status(400).json({
        success: false,
        error: "Username is required.",
      });
    }

    const trimmedName = username.trim();

    if (trimmedName.length < 2 || trimmedName.length > 50) {
      return res.status(400).json({
        success: false,
        error: "Username must be between 2 and 50 characters.",
      });
    }

    const result = await pool.query(
      "UPDATE users SET username = $1 WHERE id = $2 RETURNING id, username, phone_no, role",
      [trimmedName, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "User not found.",
      });
    }

    await cacheDel(`user:profile:${userId}`);

    const user = result.rows[0];

    return res.json({
      success: true,
      message: "Profile updated successfully.",
      user: {
        id: user.id,
        username: user.username,
        phone: user.phone_no,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Profile Update Error:", error.message);
    return res.status(500).json({
      success: false,
      error: "Failed to update profile.",
    });
  }
};
