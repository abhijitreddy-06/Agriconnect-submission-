import bcrypt from "bcrypt";
import pool from "../config/database.js";
import { generateTokens, verifyRefreshToken } from "../utils/tokenUtils.js";

// POST /signup - Create new user account
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
      "SELECT id, password, role FROM users WHERE phone_no = $1 AND role = $2",
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

    const decoded = verifyRefreshToken(refreshToken);

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
