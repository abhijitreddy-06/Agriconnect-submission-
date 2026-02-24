import pool from "../../config/database.js";

export const countByUser = async (userId) => {
  const result = await pool.query(
    "SELECT COUNT(*) FROM addresses WHERE user_id = $1",
    [userId]
  );
  return parseInt(result.rows[0].count);
};

export const unsetDefaults = async (userId, excludeId) => {
  if (excludeId) {
    await pool.query(
      "UPDATE addresses SET is_default = false WHERE user_id = $1 AND id != $2",
      [userId, excludeId]
    );
  } else {
    await pool.query(
      "UPDATE addresses SET is_default = false WHERE user_id = $1",
      [userId]
    );
  }
};

export const create = async (userId, data) => {
  const result = await pool.query(
    `INSERT INTO addresses (user_id, label, full_name, phone, address_line1, address_line2, city, state, pincode, is_default)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [userId, data.label, data.full_name, data.phone, data.address_line1, data.address_line2 || null, data.city, data.state, data.pincode, data.is_default]
  );
  return result.rows[0];
};

export const findAllByUser = async (userId) => {
  const result = await pool.query(
    "SELECT * FROM addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC",
    [userId]
  );
  return result.rows;
};

export const findByIdAndUser = async (addressId, userId) => {
  const result = await pool.query(
    "SELECT * FROM addresses WHERE id = $1 AND user_id = $2",
    [addressId, userId]
  );
  return result.rows[0] || null;
};

export const update = async (addressId, userId, data) => {
  const result = await pool.query(
    `UPDATE addresses SET
       label = COALESCE($1, label),
       full_name = COALESCE($2, full_name),
       phone = COALESCE($3, phone),
       address_line1 = COALESCE($4, address_line1),
       address_line2 = COALESCE($5, address_line2),
       city = COALESCE($6, city),
       state = COALESCE($7, state),
       pincode = COALESCE($8, pincode),
       is_default = COALESCE($9, is_default),
       updated_at = NOW()
     WHERE id = $10 AND user_id = $11
     RETURNING *`,
    [data.label, data.full_name, data.phone, data.address_line1, data.address_line2, data.city, data.state, data.pincode, data.is_default, addressId, userId]
  );
  return result.rows[0] || null;
};

export const remove = async (addressId, userId) => {
  const result = await pool.query(
    "DELETE FROM addresses WHERE id = $1 AND user_id = $2 RETURNING id, is_default",
    [addressId, userId]
  );
  return result.rows[0] || null;
};

export const setMostRecentAsDefault = async (userId) => {
  await pool.query(
    `UPDATE addresses SET is_default = true
     WHERE user_id = $1 AND id = (
       SELECT id FROM addresses WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1
     )`,
    [userId]
  );
};

export const setDefault = async (addressId) => {
  await pool.query(
    "UPDATE addresses SET is_default = true WHERE id = $1",
    [addressId]
  );
};
