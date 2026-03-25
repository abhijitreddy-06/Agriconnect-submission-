import pool from "../../config/database.js";

export const findByPhone = async (phone) => {
  const result = await pool.query(
    "SELECT id, username, role, phone_no FROM users WHERE phone_no = $1",
    [phone]
  );
  return result.rows[0] || null;
};

export const findByPhoneAndRole = async (phone, role) => {
  const result = await pool.query(
    "SELECT id, username, password, role, delivery_address FROM users WHERE phone_no = $1 AND role = $2",
    [phone, role]
  );
  return result.rows[0] || null;
};

export const findById = async (id) => {
  const result = await pool.query(
    "SELECT id, username, phone_no, role, delivery_address FROM users WHERE id = $1",
    [id]
  );
  return result.rows[0] || null;
};

export const create = async (username, phone, hashedPassword, role) => {
  const result = await pool.query(
    "INSERT INTO users (username, phone_no, password, role) VALUES ($1, $2, $3, $4) RETURNING id",
    [username, phone, hashedPassword, role]
  );
  return result.rows[0];
};

export const updateProfile = async (userId, username, deliveryAddress) => {
  const result = await pool.query(
    `UPDATE users SET username = $1, delivery_address = COALESCE($3, delivery_address)
     WHERE id = $2 RETURNING id, username, phone_no, role, delivery_address`,
    [username, userId, deliveryAddress !== undefined ? deliveryAddress : null]
  );
  return result.rows[0] || null;
};
